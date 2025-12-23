import com.sun.net.httpserver.HttpServer;

import handlers.ApiRouter;
import handlers.StaticFileHandler;

private static final int PORT = 8000;

void main() throws IOException {
    HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
    server.createContext("/api", new ApiRouter());
    server.createContext("/", new StaticFileHandler());

    server.setExecutor(null);
    IO.println("Server started at http://localhost:" + PORT);
    server.start();
}
