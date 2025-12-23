package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.google.gson.Gson;

import java.io.IOException;
import java.io.OutputStream;

public class UserHandler implements HttpHandler {
    public record User(String user, int id) {
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        Gson gson = new Gson();
        User obj = new User("yorunoken", 1);
        String response = gson.toJson(obj);

        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, response.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    }

}
