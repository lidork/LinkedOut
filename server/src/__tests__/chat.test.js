/**
 * Chat unit tests — covers Socket.io auth, message delivery, and REST endpoints.
 * Mongoose models are mocked so no real DB connection is needed.
 */

const http = require("http");
const { io: Client } = require("socket.io-client");
const jwt = require("jsonwebtoken");

// ── Env ──────────────────────────────────────────────────────────────────────
process.env.JWT_SECRET = "test-secret";

// ── Model mocks ───────────────────────────────────────────────────────────────
jest.mock("../models/User");
jest.mock("../models/Message");

const User = require("../models/User");
const Message = require("../models/Message");

// ── Helpers ───────────────────────────────────────────────────────────────────
const ALICE = { _id: "alice-id", username: "alice", displayName: "Alice", avatar: "" };
const BOB   = { _id: "bob-id",   username: "bob",   displayName: "Bob",   avatar: "" };

const makeToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });

function buildServer() {
  const app = require("express")();
  const express = require("express");
  app.use(express.json());
  app.use("/api/messages", require("../routes/messages"));
  const httpServer = http.createServer(app);
  const { initSocket } = require("../socket");
  initSocket(httpServer);
  return httpServer;
}

const closeServer = (server) => new Promise((resolve) => server.close(resolve));

function connectSocket(server, token) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const socket = Client(`http://localhost:${port}`, {
      auth: token !== undefined ? { token } : {},
      reconnection: false,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => { socket.close(); reject(err); });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Socket.io — authentication", () => {
  let server;

  beforeAll(() => {
    User.findById.mockImplementation((id) => ({
      select: () => Promise.resolve(id === ALICE._id ? ALICE : null),
    }));
    server = buildServer();
    return new Promise((resolve) => server.listen(0, resolve));
  });

  afterAll(() => closeServer(server));

  test("rejects connection with no token", async () => {
    await expect(connectSocket(server, undefined)).rejects.toThrow();
  });

  test("rejects connection with invalid token", async () => {
    await expect(connectSocket(server, "bad-token")).rejects.toThrow();
  });

  test("accepts connection with valid token", async () => {
    const socket = await connectSocket(server, makeToken(ALICE._id));
    expect(socket.connected).toBe(true);
    socket.disconnect();
  });
});

describe("Socket.io — send_message", () => {
  let server, aliceSocket, bobSocket;

  beforeAll(async () => {
    User.findById.mockImplementation((id) => ({
      select: () => Promise.resolve(id === ALICE._id ? ALICE : BOB),
    }));
    server = buildServer();
    await new Promise((resolve) => server.listen(0, resolve));
    aliceSocket = await connectSocket(server, makeToken(ALICE._id));
    bobSocket   = await connectSocket(server, makeToken(BOB._id));
  });

  afterAll(async () => {
    aliceSocket.disconnect();
    bobSocket.disconnect();
    await closeServer(server);
  });

  test("delivers message to recipient and echoes to sender", () => {
    const savedMsg = {
      _id: "msg1", from: ALICE, to: BOB, content: "Hello Bob",
      createdAt: new Date().toISOString(),
      populate: () => Promise.resolve({ _id: "msg1", from: ALICE, to: BOB, content: "Hello Bob", createdAt: new Date().toISOString() }),
    };
    Message.create.mockResolvedValue(savedMsg);

    return new Promise((resolve, reject) => {
      let received = 0;
      const finish = (msg) => {
        try {
          expect(msg.content).toBe("Hello Bob");
          if (++received === 2) resolve();
        } catch (e) { reject(e); }
      };
      bobSocket.once("new_message", finish);
      aliceSocket.once("new_message", finish);
      aliceSocket.emit("send_message", { to: BOB._id, content: "Hello Bob" });
    });
  });

  test("ignores send_message with empty content", () => {
    const spy = jest.fn();
    bobSocket.once("new_message", spy);
    aliceSocket.emit("send_message", { to: BOB._id, content: "   " });
    return new Promise((resolve) => setTimeout(() => {
      expect(spy).not.toHaveBeenCalled();
      resolve();
    }, 200));
  });
});

describe("REST — GET /api/messages", () => {
  let server, request;

  beforeAll(() => {
    const supertest = require("supertest");
    User.findById.mockImplementation(() => ({
      select: () => Promise.resolve(ALICE),
    }));
    server = buildServer();
    return new Promise((resolve) => server.listen(0, () => {
      request = supertest(server);
      resolve();
    }));
  });

  afterAll(() => closeServer(server));

  const authHeader = () => `Bearer ${makeToken(ALICE._id)}`;

  test("returns 400 when `with` param is missing", async () => {
    const res = await request.get("/api/messages").set("Authorization", authHeader());
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("returns sorted message history", async () => {
    const msgs = [
      { _id: "m1", from: ALICE, to: BOB, content: "hey", createdAt: "2025-01-01T10:00:00Z" },
      { _id: "m2", from: BOB, to: ALICE, content: "hi",  createdAt: "2025-01-01T10:01:00Z" },
    ];
    Message.find.mockReturnValue({
      sort: () => ({ populate: () => ({ populate: () => Promise.resolve(msgs) }) }),
    });

    const res = await request
      .get(`/api/messages?with=${BOB._id}`)
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[0].content).toBe("hey");
  });
});
