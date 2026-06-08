// ==========================================================================
// RikFinTech-Pro Studio - Production Local Java Database Persistence Server
// ==========================================================================
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

public class Server {
    private static final int PORT = 8000;
    private static final String LEDGER_FILE = "continuous_ledger.json";

    public static void main(String[] args) throws IOException {
        // Initialize an empty JSON array database file if it doesn't exist
        File file = new File(LEDGER_FILE);
        if (!file.exists()) {
            try (FileWriter writer = new FileWriter(file)) {
                writer.write("[]");
            }
        }

        // Create the HTTP server bound to localhost on port 8000
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", PORT), 0);
        
        // Route handlers for matching your JS app endpoints
        server.createContext("/load-ledger", new LoadLedgerHandler());
        server.createContext("/append-block", new AppendBlockHandler());
        
        // Catch-all route to serve your static assets (index.html, style.css, app.js, etc.)
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // Creates a default system executor
        System.out.println("🚀 Continuous Enterprise Java Ledger Hub Active: http://127.0.0.1:" + PORT);
        server.start();
    }

    // 1. GET /load-ledger: Streams the current file directly to the browser
    static class LoadLedgerHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                byte[] response = Files.readAllBytes(Paths.get(LEDGER_FILE));
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.getResponseHeaders().set("Cache-Control", "no-cache");
                exchange.sendResponseHeaders(200, response.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response);
                }
            } else {
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
            }
        }
    }

    // 2. POST /append-block: Reads the incoming JSON payload and appends it to disk
    static class AppendBlockHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStream is = exchange.getRequestBody();
                String newBlockJson = new String(is.readAllBytes(), StandardCharsets.UTF_8);

                synchronized (Server.class) { // Prevent file conflicts during rapid multi-clicks
                    String currentLedger = new String(Files.readAllBytes(Paths.get(LEDGER_FILE)), StandardCharsets.UTF_8).trim();
                    String updatedLedger;
                    
                    if (currentLedger.equals("[]") || currentLedger.isEmpty()) {
                        updatedLedger = "[\n    " + newBlockJson + "\n]";
                    } else {
                        // Clean, surgical string insertion to append the new block into the JSON array
                        updatedLedger = currentLedger.substring(0, currentLedger.lastIndexOf("]")) + ",\n    " + newBlockJson + "\n]";
                    }
                    
                    Files.write(Paths.get(LEDGER_FILE), updatedLedger.getBytes(StandardCharsets.UTF_8));
                }

                byte[] successMessage = "{\"status\": \"Java Disk Commit Verified\"}".getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, successMessage.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(successMessage);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // 3. GET /: Standard static asset routing handler
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html"; // Route root traffic straight to home
            }
            
            // Look for the file in the local execution directory
            File file = new File("." + path);
            if (file.exists() && !file.isDirectory()) {
                String contentType = "text/plain";
                if (path.endsWith(".html")) contentType = "text/html";
                else if (path.endsWith(".css")) contentType = "text/css";
                else if (path.endsWith(".js")) contentType = "text/javascript";

                byte[] fileBytes = Files.readAllBytes(file.toPath());
                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(200, fileBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(fileBytes);
                }
            } else {
                byte[] errorMsg = "404 Not Found".getBytes();
                exchange.sendResponseHeaders(404, errorMsg.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(errorMsg);
                }
            }
        }
    }
}
