package com.example.cinema_client;
import io.qameta.allure.*;
import com.microsoft.playwright.*;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.*;

import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Assertions;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class HomepageTest extends TestContext {

    /**
     * Login function use for testing purpose
     * @param page Page that is currently being tested
     */
    private void login(Page page) {
        page.locator("a[data-target='#modalLoginForm']").click();
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Email")).fill("example1@gmail.com");
        page.getByRole(AriaRole.TEXTBOX, new Page.GetByRoleOptions().setName("Mật khẩu")).fill("1234567");
        page.locator("#modalLoginForm").locator("button[type='submit']").click();

        assertThat(page.getByText("Test1")).isVisible();
    }


    /**
     * Test case UI_H01: Homepage Testing - Carouse Auto-scroll.
     * Description: Test to verify homepage movie Carouse can auto scrolls after a certain amount of time
     * Expected Output: After 4-5 seconds, Auto scroll to the next movie banner
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void carouselAutoScroll() {
        page.navigate("http://localhost:8081/");

        Locator activeIndicator = page.locator("ul.carousel-indicators li.active");

        String firstActiveSlide = activeIndicator.getAttribute("data-slide-to");

        page.waitForTimeout(15000);
        String secondActiveSlide = activeIndicator.getAttribute("data-slide-to");

        Assertions.assertNotEquals(firstActiveSlide, secondActiveSlide);
    }


    /**
     * Test case UI_H02: Homepage Testing - Carouse Manual scroll.
     * Description: Test to verify homepage movie Carouse can be moved by button ( Manual input )
     * Expected Output: Clicked the arrows on both side, can change the movie banner
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void carouselManualControls() {
        page.navigate("http://localhost:8081/");

        Locator activeIndicator = page.locator("ul.carousel-indicators li.active");
        Locator nextButton = page.locator("a.carousel-control-next");
        Locator prevButton = page.locator("a.carousel-control-prev");

        String initialSlide = activeIndicator.getAttribute("data-slide-to");


        nextButton.click();
        page.waitForTimeout(1000);
        String nextSlide = activeIndicator.getAttribute("data-slide-to");

        Assertions.assertNotEquals(initialSlide, nextSlide);

        prevButton.click();
        page.waitForTimeout(1000);
        String prevSlide = activeIndicator.getAttribute("data-slide-to");


        Assertions.assertEquals(prevSlide, initialSlide);
    }


    /**
     * Test case UI_H03: View Movie Details Testing - Not logged in.
     * Description: Test to verify user can see movie details even if they are not logged in
     * Expected Output: Details about selected movie appears
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void viewMovieDetailsNotLoggedIn() {
        page.navigate("http://localhost:8081/");

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText("Người Nhện"));

        movieCard.getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName("Chi tiết")).click();

        assertThat(page).hasURL("http://localhost:8081/movie-details?movieId=7");
        assertThat(page.getByText("Chi Tiết Phim")).isVisible();
        assertThat(page.getByText("Giới Thiệu:")).isVisible();
    }


    /**
     * Test case UI_H04: View Movie Details Testing - Logged in.
     * Description: Test to verify user can see movie details when they are logged in
     * Expected Output: Details about selected movie appears
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void viewMovieDetailsLoggedIn() {
        page.navigate("http://localhost:8081/");
        login(page);

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText("Người Nhện"));

        movieCard.getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName("Chi tiết")).click();

        assertThat(page).hasURL("http://localhost:8081/movie-details?movieId=7");
        assertThat(page.getByText("Test1")).isVisible();
    }


    /**
     * Test case UI_H05: Search Testing - Movie exists.
     * Description: Test to verify searching function can find the movie
     * Expected Output: Search results appears with the desired movie
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void searchMovieExists() {
        page.navigate("http://localhost:8081/");

        Locator searchButton = page.locator("button.search-btn");
        searchButton.click();

        page.locator("input[name='movie-name']").fill("Người nhện");

        searchButton.click();

        assertThat(page).hasURL("http://localhost:8081/");

        assertThat(page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText("Người Nhện")))
                .isVisible();

        assertThat(page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText("BlackPink The Movie")))
                .isHidden();
    }


    /**
     * Test case UI_H06: Search Testing - Movie not exist.
     * Description: Test to verify searching function can find the movie
     * Expected Output: Search results return no matching
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void searchMovieDoesNotExist() {
        page.navigate("http://localhost:8081/");

        Locator searchButton = page.locator("button.search-btn");
        searchButton.click();

        page.locator("input[name='movie-name']").fill("asdfghjkl");

        searchButton.click();

        assertThat(page.getByText("Chúng Tôi Không Tìm Thấy Phim Của Bạn")).isVisible();
        assertThat(page.getByRole(AriaRole.LINK,
                new Page.GetByRoleOptions().setName("Quay Lại Trang Chủ")))
                .isVisible();
    }


    /**
     * Test case UI_H07: Purchasing Ticket Testing - Not logged in.
     * Description: Test to verify user that is not logged in can not buy ticket
     * Expected Output: Login modal appears on screen
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void buyTicketNotLoggedIn() {
        page.navigate("http://localhost:8081/");

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText("Người Nhện"));

        Locator buyTicketButton = movieCard.getByText("Mua vé");

        buyTicketButton.click();

        assertThat(page.locator("#modalLoginForm")).isVisible();
    }


    /**
     * Test case UI_H08: Purchasing Ticket Testing - Logged in.
     * Description: Test to verify user that is logged in can buy ticket
     * Expected Output: Divert to cinema branched choosing menu
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void buyTicketLoggedIn() {
        page.navigate("http://localhost:8081/");
        login(page);

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText("Người Nhện"));

        Locator buyTicketButton = movieCard.getByText("Mua vé");

        buyTicketButton.click();

        assertThat(page).hasURL("http://localhost:8081/branches?movieId=7");
    }

    /**
     * Test case UI_H09: Display Branch List.
     * Description: Test to verify that cinema branch list can be shown to users
     * Expected Output: Branch List appears on screen
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void displayBranchList() {
        page.navigate("http://localhost:8081/");
        login(page);

        page.navigate("http://localhost:8081/branches?movieId=7");

        assertThat(page.locator("h2")).hasText("Chọn Chi Nhánh");

        Locator haDongCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText("HUYCINEMA Hà Đông"));

        assertThat(haDongCard).isVisible();

        Locator thuDucCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText("HUYCINEMA Thủ Đức"));
        assertThat(thuDucCard).isVisible();
    }


    /**
     * Test case UI_H10: Select Branch - Successful.
     * Description: Test to verify that cinema branch can be selected by users
     * Expected Output: Diverted to movie schedule menu
     */
    @Test
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void selectBranchSuccess() {
        page.navigate("http://localhost:8081/");
        login(page);

        Locator movieCard = page.locator("div.card.movie-item")
                .filter(new Locator.FilterOptions().setHasText("Người Nhện"));
        Locator buyTicketButton = movieCard.getByText("Mua vé");
        buyTicketButton.click();
        assertThat(page).hasURL("http://localhost:8081/branches?movieId=7");
        Locator haDongCard = page.locator("div.card.branch-item")
                .filter(new Locator.FilterOptions().setHasText("HUYCINEMA Hà Đông"));
        haDongCard.getByRole(AriaRole.LINK).click();
        assertThat(page).hasURL("http://localhost:8081/schedule?movieId=7&branchId=1");

    }
}
