package com.example.cinema_client;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.WaitForSelectorState;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import io.qameta.allure.*;

public class StateContext extends TestContext {

    // path file nằm cùng thư mục với file StateContext.java
    Path AUTH_FILE = Paths.get("src","test","java","com","example","cinema_client","state.json");

    private void LogInState() throws IOException {
        Files.createDirectories(AUTH_FILE.getParent());

        String USERNAME = System.getenv().getOrDefault("PW_USERNAME", "testr1@gmail.com");
        String PASSWORD = System.getenv().getOrDefault("PW_PASSWORD", "123456");

        Playwright pw = null;
        Browser browser = null;
        BrowserContext ctx = null;

        try {
            pw = Playwright.create();
            browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));
            ctx = browser.newContext(); // context trống
            Page page = ctx.newPage();

            // timeout cơ bản
            page.setDefaultTimeout(15000);
            page.setDefaultNavigationTimeout(30000);

            // 1) Mở trang
            page.navigate("http://localhost:8081/");

            // 2) Mở modal đăng nhập
            page.locator("a[data-target=\"#modalLoginForm\"]").click();
            Locator modal = page.locator("#modalLoginForm");
            modal.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));

            // 3) Điền form bằng selector chắc cú theo name
            modal.locator("input[name='username']").fill(USERNAME);
            modal.locator("input[name='password']").fill(PASSWORD);

            // 4) Click submit và BẮT response POST /account/login (đúng chữ ký Java)
            page.waitForResponse(
                    r -> r.url().contains("/account/login") && "POST".equals(r.request().method()),
                    () -> modal.locator("button[type='submit']").click()
            );

            // 5) Fallback: nếu app điều hướng/SPA, chờ mạng rảnh
            try {
                page.waitForLoadState(LoadState.NETWORKIDLE);
            } catch (PlaywrightException ignored) {}

            // 6) Kiểm tra dấu hiệu đã login (tuỳ app bạn)
            boolean loggedIn =
                    page.locator("text=Đăng xuất").isVisible() ||
                            page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng xuất")).isVisible(new Locator.IsVisibleOptions().setTimeout(1000));

            if (!loggedIn) {
                System.out.println("⚠️  Chưa thấy dấu hiệu 'Đăng xuất'. Vẫn lưu state, nhưng có thể phiên chưa hợp lệ.");
            }

            // 7) Lưu STORAGE STATE
            ctx.storageState(new BrowserContext.StorageStateOptions().setPath(AUTH_FILE));
            System.out.println("✅ Đã lưu trạng thái đăng nhập: " + AUTH_FILE.toAbsolutePath());

        } finally {
            // Đóng tài nguyên an toàn
            if (ctx != null) try { ctx.close(); } catch (Exception ignored) {}
            if (browser != null) try { browser.close(); } catch (Exception ignored) {}
            if (pw != null) try { pw.close(); } catch (Exception ignored) {}
        }
    }

    void LogIn() throws IOException {
        LogInState();

        context = browser.newContext(new Browser.NewContextOptions().setStorageStatePath(AUTH_FILE));
        page = context.newPage();
    }

    /**
     * Delete all ticket history in database table 'ticket'
     * Then restore 2 default rows with seat_id = 5 and 10
     * Table structure: id, qr_imageurl, bill_id, schedule_id, seat_id
     */
    static void resetTicketDatabase() {
        String jdbcUrl = "jdbc:mysql://localhost:3306/cinema";
        String username = "root";
        String password = "1234";

        try {
            // Load MySQL JDBC Driver
            Class.forName("com.mysql.cj.jdbc.Driver");

            try (Connection connection = DriverManager.getConnection(jdbcUrl, username, password)) {
                // 1) Xóa tất cả vé
                String deleteQuery = "DELETE FROM ticket";
                try (Statement statement = connection.createStatement()) {
                    int rowsAffected = statement.executeUpdate(deleteQuery);
                    System.out.println("Đã xóa " + rowsAffected + " vé khỏi bảng ticket");
                }

                // 2) Reset auto_increment về 1
                String resetAutoIncrement = "ALTER TABLE ticket AUTO_INCREMENT = 1";
                try (Statement statement = connection.createStatement()) {
                    statement.executeUpdate(resetAutoIncrement);
                    System.out.println("Đã reset AUTO_INCREMENT của bảng ticket");
                }

                // 3) Khôi phục 2 rows mặc định với seat_id = 5 và 10
                String insertQuery = "INSERT INTO ticket (qr_imageurl, bill_id, schedule_id, seat_id) VALUES " +
                        "('qr_code_5', 1, 1, 5), " +
                        "('qr_code_10', 1, 1, 10)";
                try (Statement statement = connection.createStatement()) {
                    int rowsInserted = statement.executeUpdate(insertQuery);
                    System.out.println("Đã khôi phục " + rowsInserted + " vé mặc định (seat_id: 5, 10)");
                }
            }
        } catch (ClassNotFoundException e) {
            System.err.println("Lỗi: Không tìm thấy MySQL JDBC Driver");
            e.printStackTrace();
        } catch (SQLException e) {
            System.err.println("Lỗi khi xóa/khôi phục dữ liệu vé từ cơ sở dữ liệu: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @AfterEach
    void cleanUpDatabase() {
        resetTicketDatabase();
    }

}
