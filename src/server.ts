import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import { Server } from 'https://deno.land/x/socket_io@0.2.0/mod.ts';

const isProduction = Deno.env.get('MODE') === 'production';
const io = new Server({
  cors: {
    origin: ['https://erd-editor.io'],
    credentials: true,
  },
});

io.on('connection', socket => {
  socket.on('join-room', roomId => {
    socket.join(roomId);
  });

  socket.on('request-host-schema', roomId => {
    socket.to(roomId).emit('request-host-schema', roomId);
  });

  socket.on('host-schema', ({ roomId, value }) => {
    socket.to(roomId).emit('host-schema', value);
  });

  socket.on('dispatch', ({ roomId, value }) => {
    socket.to(roomId).emit('dispatch', value);
  });

  socket.on('disconnect', () => {
    // TODO: host check
  });
});

await serve(io.handler(), {
  port: isProduction ? 80 : 3000,
});
