
# **scrape2gether - Chrome Extension**

scrape2gether is a web scraping tool that leverages human interaction to collect data from websites. By relying on human traffic instead of automated bots, scrape2gether bypasses the limitations of traditional web scraping, like `robots.txt`, and promotes a user-driven approach to web data collection.

This extension is currently in development for Google Chrome.

---

## **Installation**

Follow these steps to install scrape2gether on your Chrome browser:

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/tommi-fish/scrape2gether-extension
   ```
2. Open Chrome and navigate to the [Extensions page](chrome://extensions/).
3. Enable **Developer Mode** (toggle in the top-right corner of the page).
4. Click the **Load Unpacked** button.
5. Select the folder where you cloned the repository (specifically the `scrape2gether-extension` folder).

Your scrape2gether extension is now ready to use!

---

## **Usage**

1. Open the scrape2gether popup by clicking on its icon in the Chrome toolbar.
2. Use the interface to add CSS selectors for the elements you want to scrape.
   - Provide a name and a valid CSS selector for each target.
3. View and manage your saved selectors in the popup.
4. Scrape live data from web pages and download or use the collected data as needed.

---

## **Features**

### **Current Features**
- **Customizable Selectors**: Add and manage custom CSS selectors for any webpage elements.
- **Live Data Scraping**: Collect data dynamically from the elements you specify.
- **Visual Feedback**: Highlight scraped elements on the page for easy verification.
- **Persistent Storage**: Save your selectors locally to re-use them across sessions.
- **JSON Export**: View and export collected data in a structured JSON format.

---

## **Planned Features**
- **Community Sharing**: Share and use pre-configured selectors created by other scrape2gether users.
- **Browser Compatibility**: Extend support to Firefox and other Chromium-based browsers.
- **Advanced Export Options**: Export data to CSV, Excel, or Google Sheets.

---

## **Contributing**

To contribute:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add description of changes"
   ```
4. Push to your fork and submit a pull request:
   ```bash
   git push origin feature-name
   ```

---

### **Contact**
For any questions or support, feel free to reach out via GitHub Issues.

---

### **Acknowledgements**
- Thanks to the open-source community for inspiration and support.
- Built with love and a mission to democratize web scraping.
