package com.example.cinema_client;
import io.qameta.allure.*;
import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.LoadState;
import com.microsoft.playwright.options.SelectOption;
import org.junit.jupiter.api.Test;
import com.microsoft.playwright.*;

import java.io.IOException;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class BuyTicketTest extends StateContext {

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
     * Test case UI_B1: Schedule Selection Testing - Choose custom date and time.
     * Description: User selects a movie schedule from the available options.
     * Expected Output: The user is redirected to the room selection page after submitting the schedule.
     */
    @Test
    void ScheduleSelection() throws IOException {

        LogIn();

        /** Test case UI_H10 - selectBranchSuccess() */
        page.navigate("http://localhost:8081/");

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText(MOVIE_NAME));
        Locator buyTicketButton = movieCard.getByText("Mua vé");
        buyTicketButton.click();

        // assertThat(page).hasURL("http://localhost:8081/branches?movieId=7");

        Locator branchCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText(BRANCH_NAME));
        branchCard.getByRole(AriaRole.LINK).click();

        // assertThat(page).hasURL("http://localhost:8081/schedule?movieId=7&branchId=1");

        // page.navigate("http://localhost:8081/schedule?movieId=7&branchId=1");

        // CHỌN NGÀY XEM — theo value
        page.selectOption("#listDate", new SelectOption().setValue(DATE_VALUE));
        assertThat(page.locator("#listDate")).hasValue(DATE_VALUE);

        // CHỌN GIỜ XEM
        page.selectOption("#listTimes", new SelectOption().setValue(TIME_VALUE));
        assertThat(page.locator("#listTimes")).hasValue(TIME_VALUE);

        // SUBMIT <input type="submit" class="btn btn-outline-danger btn-block">
        Locator submit = page.locator("input[type=\"submit\"].btn.btn-outline-danger.btn-block");
        assertThat(submit).isVisible();

        // Bấm và chờ điều hướng (gộp song song)
        page.waitForNavigation(() -> submit.click());

        // Xác nhận URL đích
        assertThat(page).hasURL("http://localhost:8081/room-selection");

        // kiểm tra title trang <h2 class="container">Chọn Phòng</h2>
        Locator header = page.locator("h2.container");
        assertThat(header).hasText("Chọn Phòng");
    }

    /**
     * Test case UI_B2: Schedule Selection Testing - Default date and time
     * Description: User submits the schedule selection form without changing the default date and time.
     * Expected Output: The user is redirected to the room selection page with default schedule parameters.
     */
    @Test
    void DefaultScheduleSelection() throws IOException {

        LogIn();

        /** Test case UI_H10 - selectBranchSuccess() */
        page.navigate("http://localhost:8081/");

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText(MOVIE_NAME));
        Locator buyTicketButton = movieCard.getByText("Mua vé");
        buyTicketButton.click();

        // assertThat(page).hasURL("http://localhost:8081/branches?movieId=7");

        Locator branchCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText(BRANCH_NAME));
        branchCard.getByRole(AriaRole.LINK).click();

        // assertThat(page).hasURL("http://localhost:8081/schedule?movieId=7&branchId=1");

        // page.navigate("http://localhost:8081/schedule?movieId=7&branchId=1");

        // Lấy giá trị mặc định của ngày và giờ
        String defaultDate = page.locator("#listDate").inputValue();
        String defaultTime = page.locator("#listTimes").inputValue();

        // Xác nhận giá trị mặc định
        assertThat(page.locator("#listDate")).hasValue(defaultDate);
        assertThat(page.locator("#listTimes")).hasValue(defaultTime);

        // SUBMIT
        Locator submit = page.locator("input[type=\"submit\"].btn.btn-outline-danger.btn-block");
        assertThat(submit).isVisible();

        // Bấm và chờ điều hướng (gộp song song)
        page.waitForNavigation(() -> submit.click());

        // Xác nhận URL đích
        assertThat(page).hasURL("http://localhost:8081/room-selection");

        Locator header = page.locator("h2.container");
        assertThat(header).hasText("Chọn Phòng");
    }

    /**
     * Test case UI_B3: Room Selection Testing
     * Description: User selects a room from the available options.
     * Expected Output: The user is redirected to the seat selection page after submitting the room selection.
     */
    @Test
    void RoomSelection() throws IOException {
        LogIn();

        /** Test case UI_H10 - selectBranchSuccess() */
        page.navigate("http://localhost:8081/");

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText(MOVIE_NAME));
        Locator buyTicketButton = movieCard.getByText("Mua vé");
        buyTicketButton.click();

        Locator branchCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText(BRANCH_NAME));
        branchCard.getByRole(AriaRole.LINK).click();

        // SUBMIT
        Locator submit = page.locator("input[type=\"submit\"].btn.btn-outline-danger.btn-block");

        // Bấm và chờ điều hướng (gộp song song)
        page.waitForNavigation(() -> submit.click());

        Locator roomCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText(ROOM_NAME));
        roomCard.getByRole(AriaRole.LINK).click();

        // Xác nhận URL đích có chứa seat-selection
        assertThat(page).hasURL(java.util.regex.Pattern.compile(".*seat-selection.*"));

        Locator header = page.locator("div.container > h1");
        assertThat(header).hasText("Chọn Chỗ Ngồi");
    }

    /**
     * Test case UI_B4: Seat Selection Testing - Select available seats.
     * Description: User selects seats from the available options.
     * Expected Output: The user is redirected to the bill page after submitting the seat selection.
     */
    @Test
    void AvailableSeatSelection() throws IOException {
        LogIn();

        String url = "http://localhost:8081/seat-selection?movieId=7&branchId=1&startDate=2021-01-05&startTime=10:15&roomId=1";
        page.navigate(url);

        // CHỌN GHẾ (DANH SÁCH GHẾ ARRAY)
        for (String seat : SELECTED_SEATS) {
            Locator seatLocation = page.locator("input[name='seats'][value='" + seat + "']");
            seatLocation.check();
            assertThat(seatLocation).isChecked();
        }

        // SUBMIT
        Locator submit = page.locator("input[type='submit'].btn-outline-danger");
        assertThat(submit).isVisible();

        // Bấm và CHỜ điều hướng tới /bill
        submit.click();
        page.waitForLoadState(LoadState.NETWORKIDLE);
        assertThat(page).hasURL("http://localhost:8081/bill");

        Locator header = page.locator("div.container > h2");
        assertThat(header).hasText("Thanh toán hóa đơn");
    }

    /**
     * Test case UI_B5: Seat Selection Testing - Attempt to select already booked seats.
     * Description: User attempts to select seats that have already been booked.
     * Expected Output: The system prevents the selection of already booked seats.
     */
    @Test
    void BookedSeatSelection() throws IOException {
        LogIn();

        String url = "http://localhost:8081/seat-selection?movieId=7&branchId=1&startDate=2021-01-05&startTime=10:15&roomId=1";
        page.navigate(url);

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
     * Test case UI_B6: Seat Selection Testing - No seats selected.
     * Description: User attempts to submit the seat selection form without selecting any seats.
     * Expected Output: The system prevents form submission and prompts the user to select seats.
     */
    @Test
    void NoSeatSelected() throws IOException {
        LogIn();

        String url = "http://localhost:8081/seat-selection?movieId=7&branchId=1&startDate=2021-01-05&startTime=10:15&roomId=1";
        page.navigate(url);

        // SUBMIT
        Locator submit = page.locator("input[type='submit'].btn-outline-danger");
        assertThat(submit).isDisabled();
    }

    /**
     * Test case UI_B7: Bill Payment Testing - Successful payment.
     * Description: User completes the bill payment process.
     * Expected Output: The ticket purchase is successful, and the result is shown on the ticket page.
     */
    @Test
    void BillPaymentSuccess() throws IOException {
        AvailableSeatSelection();

        // Click thanh toán
        Locator payButton = page.locator("a.btn.btn-outline-danger.btn-block");
        assertThat(payButton).isVisible();

        // Bấm và CHỜ điều hướng tới lịch sử vé
        payButton.click();
        page.waitForLoadState(LoadState.NETWORKIDLE);
        assertThat(page).hasURL("http://localhost:8081/tickets/history");
        Locator header = page.locator("div.container-fluid > h2");
        assertThat(header).hasText("Lịch Sử Mua Vé");
    }

    /**
     * Test case UI_B8: History Page Testing - View ticket history.
     * Description: User navigates to the ticket history page to view past purchases.
     * Expected Output: The ticket history page displays a list of previously purchased tickets.
     */
    @Test
    void ViewTicketHistory() throws IOException {
        LogIn();

        // Điều hướng tới trang lịch sử vé
        page.navigate("http://localhost:8081/");

        // <a class="nav-link" href="/tickets/history">Lịch sử mua vé</a>
        Locator historyLink = page.locator("a.nav-link").filter(new Locator.FilterOptions().setHasText("Lịch sử mua vé"));
        historyLink.isVisible();
        historyLink.click();

        assertThat(page).hasURL("http://localhost:8081/tickets/history");
        Locator header = page.locator("div.container-fluid > h2");
        assertThat(header).hasText("Lịch Sử Mua Vé");
    }

}
