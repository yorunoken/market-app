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
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class ProductHandler implements HttpHandler {

    record Product(long id, String name, double price, String category, int stock, String image) {
    }

    private static final String DB_FILE = "products.json";
    private static final String IMG_DIR = "www/images/";
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
        if (!Files.exists(Path.of(DB_FILE))) {
            Files.writeString(Path.of(DB_FILE), "[]");
        }
        String json = Files.readString(Path.of(DB_FILE));
        sendResponse(exchange, 200, json);
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Product incoming = gson.fromJson(body, Product.class);

        String imagePath = incoming.image();

        if (imagePath != null && imagePath.startsWith("data:image")) {
            try {
                Files.createDirectories(Path.of(IMG_DIR));

                String extension = getString(imagePath);

                String base64Data = imagePath.split(",")[1];
                byte[] imageBytes = Base64.getDecoder().decode(base64Data);

                String fileName = incoming.id() + extension;
                Path targetPath = Path.of(IMG_DIR + fileName);
                Files.write(targetPath, imageBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

                imagePath = "images/" + fileName;

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        Product productToSave = new Product(
                incoming.id(),
                incoming.name(),
                incoming.price(),
                incoming.category(),
                incoming.stock(),
                imagePath
        );

        List<Product> products = loadProducts();
        products.removeIf(p -> p.id() == productToSave.id());
        products.add(productToSave);

        saveProducts(products);
        sendResponse(exchange, 200, "{\"status\":\"saved\", \"image\":\"" + imagePath + "\"}");
    }

    private static String getString(String imagePath) {
        String header = imagePath.split(",")[0];
        String extension = ".png";

        if (header.contains("image/jpeg") || header.contains("image/jpg")) {
            extension = ".jpg";
        } else if (header.contains("image/gif")) {
            extension = ".gif";
        } else if (header.contains("image/webp")) {
            extension = ".webp";
        } else if (header.contains("image/svg")) {
            extension = ".svg";
        }
        return extension;
    }

    private void handleDelete(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        if (query != null && query.contains("id=")) {
            long idToDelete = Long.parseLong(query.split("=")[1]);

            List<Product> products = loadProducts();

            Product existing = products.stream().filter(p -> p.id() == idToDelete).findFirst().orElse(null);
            if (existing != null && existing.image().startsWith("images/")) {
                Files.deleteIfExists(Path.of("www/" + existing.image()));
            }

            boolean removed = products.removeIf(p -> p.id() == idToDelete);

            if (removed) {
                saveProducts(products);
                sendResponse(exchange, 200, "{\"status\":\"deleted\"}");
            } else {
                sendResponse(exchange, 404, "{\"error\":\"Not found\"}");
            }
        }
    }

    private List<Product> loadProducts() throws IOException {
        if (!Files.exists(Path.of(DB_FILE))) return new ArrayList<>();
        String json = Files.readString(Path.of(DB_FILE));
        return gson.fromJson(json, new TypeToken<ArrayList<Product>>() {
        }.getType());
    }

    private void saveProducts(List<Product> products) throws IOException {
        String json = gson.toJson(products);
        Files.writeString(Path.of(DB_FILE), json);
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