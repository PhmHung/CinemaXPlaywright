package com.example.cinema_client;
import io.qameta.allure.*;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.LoadState;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class E2EBuyTicket extends StateContext {

    /**
     * Value for testing
     */
    final String MOVIE_NAME = "Người Nhện";
    final String BRANCH_NAME = "HUYCINEMA Hà Đông";
    final String DATE_VALUE = "2021-01-08";
    final String TIME_VALUE = "14:05";
    final String ROOM_NAME = "Phòng 101";
    final String[] SELECTED_SEATS = {"2", "3"};

    /**
     * Test case E2E_B1: End-to-End Buy Ticket Flow - Not Logged In
     * Description: User attempts to select a movie schedule without being logged in.
     * Expected Output: The system prompts the user to log in before buying tickets.
     */
    @Test
    public void E2E_B1_NotLoggedIn() throws IOException {
        page.navigate("http://localhost:8081/");

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText(MOVIE_NAME));
        Locator buyTicketButton = movieCard.getByText("Mua vé");
        buyTicketButton.click();

        assertThat(page.locator("#modalLoginForm")).isVisible();
    }

    /**
     * Test case E2E_B2: End-to-End Buy Ticket Flow - Invalid seat selection
     * Description: User logs in but attempts to select an invalid seat.
     * Expected Output: The system prevents the user from selecting invalid seats and shows an error message
     */
    @Test
    public void E2E_B2_InvalidSeatSelection() throws IOException {
        LogIn();

        page.navigate("http://localhost:8081/");

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText(MOVIE_NAME));
        Locator buyTicketButton = movieCard.getByText("Mua vé");
        buyTicketButton.click();

        Locator branchCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText(BRANCH_NAME));
        branchCard.getByRole(AriaRole.LINK).click();

        // SUBMIT
        Locator branch_submit = page.locator("input[type=\"submit\"].btn.btn-outline-danger.btn-block");

        // Bấm và chờ điều hướng (gộp song song)
        page.waitForNavigation(() -> branch_submit.click());

        Locator roomCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText(ROOM_NAME));
        roomCard.getByRole(AriaRole.LINK).click();

        // Xác nhận URL đích có chứa seat-selection
        assertThat(page).hasURL(java.util.regex.Pattern.compile(".*seat-selection.*"));

        Locator header = page.locator("div.container > h1");
        assertThat(header).hasText("Chọn Chỗ Ngồi");

        String[] bookedSeats = {"5", "10"};
        for (String seat : bookedSeats) {
            Locator seatLocation = page.locator("input[name='seats'][value='" + seat + "']");
            seatLocation.check();
            assertThat(seatLocation).isDisabled();
        }

        // SUBMIT
        Locator submit = page.locator("input[type='submit'].btn-outline-danger");
        assertThat(submit).isDisabled();
    }

    /**
     * Test case E2E_B3: End-to-End Buy Ticket Flow - Successful purchase
     * Description: User logs in and successfully selects seats and completes the purchase.
     * Expected Output: The system processes the purchase and displays a confirmation message.
     */
    @Test
    public void E2E_B3_SuccessfulPurchase() throws IOException {
        LogIn();

        page.navigate("http://localhost:8081/");

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText(MOVIE_NAME));
        Locator buyTicketButton = movieCard.getByText("Mua vé");
        buyTicketButton.click();

        Locator branchCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText(BRANCH_NAME));
        branchCard.getByRole(AriaRole.LINK).click();

        // SUBMIT
        Locator branch_submit = page.locator("input[type=\"submit\"].btn.btn-outline-danger.btn-block");

        // Bấm và chờ điều hướng (gộp song song)
        page.waitForNavigation(() -> branch_submit.click());

        Locator roomCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText(ROOM_NAME));
        roomCard.getByRole(AriaRole.LINK).click();

        // Xác nhận URL đích có chứa seat-selection
        assertThat(page).hasURL(java.util.regex.Pattern.compile(".*seat-selection.*"));

        Locator header = page.locator("div.container > h1");
        assertThat(header).hasText("Chọn Chỗ Ngồi");

        for (String seat : SELECTED_SEATS) {
            Locator seatLocation = page.locator("input[name='seats'][value='" + seat + "']");
            seatLocation.check();
            assertThat(seatLocation).isChecked();
        }

        // SUBMIT
        Locator submit = page.locator("input[type='submit'].btn-outline-danger");
        assertThat(submit).isEnabled();

        // Bấm và chờ điều hướng (gộp song song)
        page.waitForNavigation(() -> submit.click());

        // Click thanh toán
        Locator payButton = page.locator("a.btn.btn-outline-danger.btn-block");
        assertThat(payButton).isVisible();

        // Bấm và CHỜ điều hướng tới lịch sử vé
        payButton.click();
        page.waitForLoadState(LoadState.NETWORKIDLE);
        assertThat(page).hasURL("http://localhost:8081/tickets/history");
        Locator header2 = page.locator("div.container-fluid > h2");
        assertThat(header2).hasText("Lịch Sử Mua Vé");
    }
}
