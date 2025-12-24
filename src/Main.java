import com.sun.net.httpserver.HttpServer;

import handlers.ApiRouter;
import handlers.StaticFileHandler;

import java.io.IOException;
import java.net.InetSocketAddress;

public class Main {
    private static final int PORT = 8000;

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api", new ApiRouter());
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null);
        System.out.println("Server started at http://localhost:" + PORT);
        server.start();
    }
}
