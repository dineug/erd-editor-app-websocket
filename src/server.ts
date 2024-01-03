import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import { Server } from 'https://deno.land/x/socket_io@0.2.0/mod.ts';

const isProduction = Deno.env.get('MODE') === 'production';
const io = new Server({
  cors: {
    origin: [
      'https://erd-editor.io',
      ...(isProduction ? [] : ['http://localhost:8080']),
    ],
    credentials: true,
  },
});

let dispatch = (data: { to: string; eventName: string; value: any }) => {};

if (isProduction) {
  const channel = new BroadcastChannel('@websocket');
  channel.onmessage = ({ data }) => {
    const { to, eventName, value } = data;
    io.to(to).emit(eventName, value);
  };
  dispatch = (data: { to: string; eventName: string; value: any }) => {
    channel.postMessage(data);
  };
}

io.on('connection', socket => {
  const hostRoomSet = new Set<string>();

  socket.on('host-join-room', roomId => {
    hostRoomSet.add(roomId);
    socket.join(roomId);
    socket.to(roomId).emit('host-join');
    dispatch({ to: roomId, eventName: 'host-join', value: null });
  });

  socket.on('host-leave-room', roomId => {
    hostRoomSet.delete(roomId);
    socket.leave(roomId);
    socket.to(roomId).emit('host-leave');
    dispatch({ to: roomId, eventName: 'host-leave', value: null });
  });

  socket.on('guest-join-room', roomId => {
    socket.join(roomId);
  });

  socket.on('guest-leave-room', roomId => {
    socket.leave(roomId);
  });

  socket.on('request-host-schema', roomId => {
    socket.to(roomId).emit('request-host-schema', roomId);
    dispatch({ to: roomId, eventName: 'request-host-schema', value: roomId });
  });

  socket.on('host-schema', ({ roomId, value }) => {
    socket.to(roomId).emit('host-schema', { roomId, value });
    dispatch({
      to: roomId,
      eventName: 'host-schema',
      value: { roomId, value },
    });
  });

  socket.on('dispatch', ({ roomId, value }) => {
    socket.to(roomId).emit('dispatch', { roomId, value });
    dispatch({ to: roomId, eventName: 'dispatch', value: { roomId, value } });
  });

  socket.on('disconnecting', () => {
    Array.from(hostRoomSet.values()).forEach(roomId => {
      socket.to(roomId).emit('host-leave');
      dispatch({ to: roomId, eventName: 'host-leave', value: null });
    });
  });

  socket.on('disconnect', () => {
    hostRoomSet.clear();
  });
});

await serve(io.handler(), {
  port: isProduction ? 80 : 3000,
});
