import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import { Server } from 'https://deno.land/x/socket_io@0.2.0/mod.ts';

const io = new Server({
  cors: {
    origin: ['https://erd-editor.io'],
    credentials: true,
  },
});

io.on('connection', socket => {
  console.log(`socket ${socket.id} connected`);

  socket.emit('hello', { message: 'hello' });

  socket.on('disconnect', reason => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
  });
});

await serve(io.handler(), {
  port: 3000,
});
