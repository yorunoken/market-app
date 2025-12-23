package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class CategoryHandler implements HttpHandler {

    private static final String DB_FILE = "categories.json";
    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        switch (method) {
            case "GET" -> handleGet(exchange);
            case "POST" -> handlePost(exchange);
            case "DELETE" -> handleDelete(exchange);
            default -> exchange.sendResponseHeaders(405, -1);
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        List<String> categories = loadCategories();
        if (categories.isEmpty()) {
            categories = List.of("İçecekler", "Gıda", "Temizlik", "Manav", "Atıştırmalık");
            saveCategories(categories);
        }
        sendResponse(exchange, 200, gson.toJson(categories));
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String newCategory = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        newCategory = newCategory.replace("\"", "").trim();

        List<String> categories = loadCategories();

        if (!categories.contains(newCategory)) {
            categories.add(newCategory);
            saveCategories(categories);
            sendResponse(exchange, 200, "{\"status\":\"saved\"}");
        } else {
            sendResponse(exchange, 400, "{\"error\":\"Exists\"}");
        }
    }

    private void handleDelete(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        if (query != null && query.contains("name=")) {
            String nameToDelete = query.split("=")[1];
            nameToDelete = java.net.URLDecoder.decode(nameToDelete, StandardCharsets.UTF_8);

            List<String> categories = loadCategories();
            boolean removed = categories.remove(nameToDelete);

            if (removed) {
                saveCategories(categories);
                sendResponse(exchange, 200, "{\"status\":\"deleted\"}");
            } else {
                sendResponse(exchange, 404, "{\"error\":\"Not found\"}");
            }
        }
    }

    private List<String> loadCategories() throws IOException {
        if (!Files.exists(Path.of(DB_FILE))) return new ArrayList<>();
        String json = Files.readString(Path.of(DB_FILE));
        return gson.fromJson(json, new TypeToken<ArrayList<String>>() {
        }.getType());
    }

    private void saveCategories(List<String> categories) throws IOException {
        Files.writeString(Path.of(DB_FILE), gson.toJson(categories));
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}