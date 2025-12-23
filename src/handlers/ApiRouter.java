package handlers;

import api.CategoryHandler;
import api.ProductHandler;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;

public class ApiRouter implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String fullPath = exchange.getRequestURI().getPath();

        if (fullPath.startsWith("/api/products")) {
            new ProductHandler().handle(exchange);
        }
        if (fullPath.startsWith("/api/categories")) {
            new CategoryHandler().handle(exchange);
        } else {
            sendError(exchange, 404, "API Endpoint not found");
        }
    }

    private void sendError(HttpExchange exchange, int code, String message) throws IOException {
        String json = "{\"error\": \"" + message + "\"}";
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(code, json.length());
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json.getBytes());
        }
    }
}
