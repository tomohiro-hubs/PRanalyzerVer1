# PR Analyzer (Static Web App)

This is a client-side static web application for analyzing Photovoltaic (PV) Power Plant Performance Ratio (PR).
It runs entirely in the browser using React (via CDN), Tailwind CSS, and Babel Standalone.

## Project Structure

*   `index.html`: The main entry point containing the HTML structure and loading external libraries (CDN).
*   `js/app.js`: Contains the main React application logic, components, and data processing algorithms.

## Features

1.  **PR Analyzer**
    *   **CSV Upload**: Supports Shift-JIS and UTF-8 encoded CSV files.
    *   **Dynamic Parsing**: Automatically detects PCS columns (`pcs_XXX_kwh`) and calculates daily PR.
    *   **Heatmap Visualization**: Displays daily PR values in a table with color-coded cells (Blue=Low to Orange=High).
    *   **Excel Export**: Download processed data as an `.xlsx` file.
    *   **Template Download**: Provides a strictly formatted CSV template for users.

2.  **Panel Area Calculator**
    *   Calculates total PV panel area based on dimensions (vertical/horizontal) and quantity.

## How to Use

1.  Open `index.html` in a modern web browser.
2.  Navigate between "PR Analyzer" and "Panel Area Calculator" using the header menu.
3.  **For PR Analyzer**:
    *   Download the CSV template.
    *   Fill in your generation data (Date, Irradiation, PCS generation).
    *   Upload the CSV to view the Heatmap and export results.

## Technical Details

*   **Framework**: React 18 (UMD build)
*   **Styling**: Tailwind CSS (CDN)
*   **CSV Parsing**: PapaParse
*   **Excel Generation**: SheetJS (xlsx)
*   **Deployment**: Static file hosting (no build process required).

## Development

To make changes:
1.  Edit `js/app.js` for logic and UI components.
2.  Edit `index.html` for global styles or library imports.
