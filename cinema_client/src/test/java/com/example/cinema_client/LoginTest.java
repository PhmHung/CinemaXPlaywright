package com.example.cinema_client;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.*;

import java.util.concurrent.TimeUnit;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class LoginTest extends TestContext {

    /**
     * Test case UI_L01: Login test - Successful
     * Description: Test to verify login function. Assume that user already have a valid account
     * Expected Output: User logins successfully
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void loginTesting() {
        page.navigate("http://localhost:8081/");

        Locator registerButton = page.locator("a[data-target='#modalLoginForm']");
        Locator emailInput = page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email"));
        Locator passwordInput = page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu"));

        registerButton.click();

        emailInput.fill("example@gmail.com");
        passwordInput.fill("1234567");

        Locator registerModal = page.locator("#modalLoginForm");
        Locator submitButton = registerModal.locator("button[type='submit']");
        submitButton.click();

        assertThat(page.getByText("Test1")).isVisible();

        assertThat(page.getByRole(AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Lịch sử mua vé"))
        ).isVisible();

        assertThat(page.getByRole(AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Đăng xuất"))
        ).isVisible();
    }

    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    @Test
    void loginTestingByCodegen() {
        //Test recorded by Codegen
        page.navigate("http://localhost:8081/");
        page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Đăng nhập")).click();
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).click();
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("example@gmail.com");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).click();
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("1234567");
        page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Đăng Nhập")).click();

        assertThat(page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Lịch sử mua vé"))).isVisible();
        assertThat(page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Cá nhân"))).isVisible();
        assertThat(page.getByText("Test1")).isVisible();
    }

    /**
     * Test case UI_L02: Login test - User Account not exist.
     * Description: Test to verify login function. Assume that user haven't register
     * Expected Output: User login failed. Error appears on screen
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void loginFailUserNotExist() {
        page.navigate("http://localhost:8081/");

        page.locator("a[data-target='#modalLoginForm']").click();

        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("notexist@gmail.com");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("1234567");

        page.locator("#modalLoginForm").locator("button[type='submit']").click();

        assertThat(page.getByText("Sai email hoặc mật khẩu!")).isVisible();
    }


    /**
     * Test case UI_L03: Login test - Wrong password
     * Description: Test to verify login function. Assume that user fills in wrong password
     * Expected Output: User login failed. Error appears on screen
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void loginFailWrongPassword() {
        page.navigate("http://localhost:8081/");

        page.locator("a[data-target='#modalLoginForm']").click();

        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("example@gmail.com");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("1234567__"); // Wrong Password

        page.locator("#modalLoginForm").locator("button[type='submit']").click();

        assertThat(page.getByText("Sai email hoặc mật khẩu!")).isVisible();
    }


    /**
     * Test case UI_L04: Register test - Successful.
     * Description: Test to verify register function. Assume that user fills in valid info for all inputs
     * Expected Output: User registers successfully. Automatically login and divert to homepage
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void registerTesting() {
        page.navigate("http://localhost:8081/");

        Locator registerButton = page.locator("a[data-target='#modalRegisterForm']");
        Locator nameInput = page.getByLabel("Họ tên");
        Locator emailInput = page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email"));
        Locator passwordInput = page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu"));

        registerButton.click();

        nameInput.fill("Test5");
        emailInput.fill("example1234@gmail.com");
        passwordInput.fill("12345678910");

        Locator registerModal = page.locator("#modalRegisterForm");
        Locator submitButton = registerModal.locator("button[type='submit']");
        submitButton.click();

        assertThat(page.getByText("Test5")).isVisible();

        assertThat(page.getByRole(AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Lịch sử mua vé"))
        ).isVisible();

        assertThat(page.getByRole(AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Đăng xuất"))
        ).isVisible();
    }


    /**
     * Test case UI_L05: Register test - Email already used in other account.
     * Description: Test to verify register function. Assume that user fills in a used email - already taken by others account
     * Expected Output: User register failed. Errors appear on screen
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void registerFailEmailExists() {
        page.navigate("http://localhost:8081/");

        page.locator("a[data-target='#modalRegisterForm']").click();

        page.getByLabel("Họ tên").fill("TestUser");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("example@gmail.com");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("12345678910");

        page.locator("#modalRegisterForm").locator("button[type='submit']").click();

        assertThat(page.getByText("Đã tồn tại người dùng, vui lòng chọn tên đăng nhập khác")).isVisible();
    }


    /**
     * Test case UI_L06: Register test - Empty Name.
     * Description: Test to verify register function. Assume that user did not fill in the Name field
     * Expected Output: User register failed. Errors appear on screen
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void registerFailEmptyName() {
        page.navigate("http://localhost:8081/");

        page.locator("a[data-target='#modalRegisterForm']").click();

        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("new-user@test.com");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("validpassword123");

        page.locator("#modalRegisterForm").locator("button[type='submit']").click();

        assertThat(page.getByText("Không được để trống họ tên!")).isVisible();
    }


    /**
     * Test case UI_L07: Register test - Empty Email.
     * Description: Test to verify register function. Assume that user did not fill in the Email field
     * Expected Output: User register failed. Errors appear on screen
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void registerFailEmptyEmail() {
        page.navigate("http://localhost:8081/");

        page.locator("a[data-target='#modalRegisterForm']").click();

        page.getByLabel("Họ tên").fill("Test3");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("12345678");

        page.locator("#modalRegisterForm").locator("button[type='submit']").click();


        assertThat(page.getByText("Không được để trống email!")).isVisible();
    }


    /**
     * Test case UI_L08: Register test - Empty Password.
     * Description: Test to verify register function. Assume that user did not fill in the Password field
     * Expected Output: User register failed. Errors appear on screen
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void registerFailEmptyPassword() {
        page.navigate("http://localhost:8081/");

        page.locator("a[data-target='#modalRegisterForm']").click();

        page.getByLabel("Họ tên").fill("Test3");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("example3@gmail.com");

        page.locator("#modalRegisterForm").locator("button[type='submit']").click();


        assertThat(page.getByText("Không được để trống mật khẩu!")).isVisible();
    }


    /**
     * Test case UI_L09: Register test - Invalid password.
     * Description: Test to verify register function. Assume that user use a password that was shorter than 6 characters
     * Expected Output: User register failed. Errors appear on screen
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void registerFailPasswordTooShort() {
        page.navigate("http://localhost:8081/");

        page.locator("a[data-target='#modalRegisterForm']").click();

        page.getByLabel("Họ tên").fill("Test3");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("example3@gmail.com");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("12345");

        page.locator("#modalRegisterForm").locator("button[type='submit']").click();

        assertThat(page.getByText("Mật khẩu phải có ít nhất 6 ký tự")).isVisible();
    }


    /**
     * Test case UI_L10: Register test - Wrong email format.
     * Description: Test to verify register function. Assume that user fills in a wrong formatted email
     * Expected Output: User register failed. Errors appear on screen
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void registerFailInvalidEmailFormat() {
        page.navigate("http://localhost:8081/");

        page.locator("a[data-target='#modalRegisterForm']").click();

        page.getByLabel("Họ tên").fill("TestEmailFormat");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("not-email@g");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("12345678");

        // Nhấn Submit
        page.locator("#modalRegisterForm").locator("button[type='submit']").click();

        assertThat(page.getByText("Email không hợp lệ")).isVisible();
    }


    /**
     * Test case UI_L11: Login & Logout flow.
     * Description: Test to verify login and logout. Assume user already has an account
     * Expected Output: User login and logout successfully. Divert to homepage in both scenarios
     */
    @Timeout(value = 5, unit = TimeUnit.MINUTES)
    @Test
    void loginAndLogoutSuccess() {
        page.navigate("http://localhost:8081/");


        Locator loginModalButton = page.locator("a[data-target='#modalLoginForm']");
        Locator emailInput = page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email"));
        Locator passwordInput = page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu"));

        loginModalButton.click();

        emailInput.fill("example@gmail.com");
        passwordInput.fill("1234567");

        Locator loginModal = page.locator("#modalLoginForm");
        Locator submitLoginButton = loginModal.locator("button[type='submit']");
        submitLoginButton.click();


        assertThat(page.getByText("Test1")).isVisible();
        Locator logoutButton = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Đăng xuất"));

        assertThat(logoutButton).isVisible();

        logoutButton.click();

        assertThat(page.getByText("Test1")).isHidden();
        assertThat(page.getByRole(AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Lịch sử mua vé"))
        ).isHidden();

        assertThat(page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Đăng nhập"))).isVisible();
        assertThat(page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Đăng ký"))).isVisible();
    }

}
