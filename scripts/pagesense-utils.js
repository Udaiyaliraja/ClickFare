/**
 * PageSense A/B Test Query Parameter Appender
 * ============================================
 *
 * Defines a global namespace `PageSenseUtils` and exposes one public method:
 *
 * PageSenseUtils.appendPageSenseExperimentParams(url)
 *
 * Purpose:
 * --------
 * This method appends PageSense A/B test identifiers (Experiment Name, Variation Name,
 * and Visitor ID) as query parameters to a provided URL.
 *
 * The function performs robust input validation, handles URLs with or without schemes,
 * and gracefully manages cases where the PageSense SDK or experiment data are unavailable.
 *
 * Key Features:
 * --------------
 * - Accepts URLs **with or without schemes** (http, https)
 * - Supports valid domain patterns (example.com, www.example.org/path)
 * - Handles missing or invalid PageSense script gracefully
 * - Returns the original URL unchanged if validation or experiment data fail
 * - Defensive and non-destructive — does not modify input directly
 *
 * Example:
 * --------
 * const updatedUrl = PageSenseUtils.appendPageSenseExperimentParams("example.com/offer");
 * window.location.href = updatedUrl;
 * 
 * Author: PageSense Development Team
 * Version: Zoho Corporation Pvt Ltd
 * Version: 1.0.0
 * License: Apache 2.0
 */
(function (global) {
    // --------------------------------------------------------------------
    // Namespace Definition
    // --------------------------------------------------------------------
    if (!global.PageSenseUtils) {
    global.PageSenseUtils = {};
    }
    /**
    * Appends PageSense A/B test identifiers as query parameters to a provided URL.
    * The method safely validates the input, checks for active PageSense experiments,
    * and returns the updated URL string. If the input is invalid or no active test
    * exists, the original URL is returned unchanged.
    *
    * @function PageSenseUtils.appendPageSenseExperimentParams
    * @param {string} inputUrl - The input URL string, with or without a scheme.
    * @returns {string} - A URL string with appended A/B test query parameters, or the original URL.
    */
    global.PageSenseUtils.appendPageSenseExperimentParams = function (inputUrl) {
    try {
    // ------------------------------------------------------------
    // Validate the Input
    // ------------------------------------------------------------
    if (typeof inputUrl !== "string") {
    console.warn("[PageSense] URL must be a string. Returning original value.");
    return inputUrl;
    }
    const trimmedUrl = inputUrl.trim();
    // Reject empty or malformed URLs
    if (!trimmedUrl || /\s/.test(trimmedUrl) || /[{}|\\^`<>]/.test(trimmedUrl)) {
    console.warn("[PageSense] Invalid or malformed URL provided. Returning original value.");
    return inputUrl;
    }
    // ------------------------------------------------------------
    // Validate the URL Format
    // ------------------------------------------------------------
    // Add a temporary scheme ("https://") for validation if missing
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmedUrl);
    const validationUrl = hasScheme ? trimmedUrl : "https://" + trimmedUrl;
    try {
    const parsedUrl = new URL(validationUrl);
    // Allow only supported schemes
    if (hasScheme) {
    const allowedSchemes = ["http:", "https:"];
    if (!allowedSchemes.includes(parsedUrl.protocol)) {
    console.warn("[PageSense] Unsupported URL scheme detected. Returning original value.");
    return inputUrl;
    }
    }
    // Validate hostname structure (must include at least one dot)
    if (!parsedUrl.hostname.includes(".") || parsedUrl.hostname.startsWith(".") || parsedUrl.hostname.endsWith(".")) {
    console.warn("[PageSense] Invalid hostname in URL. Returning original value.");
    return inputUrl;
    }
    } catch {
    console.warn("[PageSense] Invalid URL structure. Returning original value.");
    return inputUrl;
    }
    // ------------------------------------------------------------
    // Check for PageSense Script Availability
    // ------------------------------------------------------------
    if (!global.zps) {
    console.info("[PageSense] PageSense script not loaded. Returning original URL unchanged.");
    return inputUrl;
    }
    if (typeof global.zps.getRunningABExperiments !== "function") {
    console.info("[PageSense] PageSense A/B API unavailable. Returning original URL unchanged.");
    return inputUrl;
    }
    // ------------------------------------------------------------
    // Retrieve and Validate Active A/B Experiment
    // ------------------------------------------------------------
    const activeExperiments = global.zps.getRunningABExperiments();
    // If no running experiment found
    if (!Array.isArray(activeExperiments) || activeExperiments.length === 0) {
    console.info("[PageSense] No running A/B test found. Returning original URL unchanged.");
    return inputUrl;
    }
    // Extract first active experiment
    const currentExperiment = activeExperiments[0];
    const {
    experiment_name: experimentName,
    variation_name: variationName,
    visitor_id: visitorId
    } = currentExperiment || {};
    // Ensure required fields exist
    if (!experimentName || !variationName || !visitorId) {
    console.warn("[PageSense] Incomplete experiment data. Returning original URL.");
    return inputUrl;
    }
    // ------------------------------------------------------------
    // Append PageSense A/B Experiment Parameters
    // ------------------------------------------------------------
    const [baseUrl, queryPart] = trimmedUrl.split("?");
    const queryParams = new URLSearchParams(queryPart || "");
    // Remove any existing PageSense parameters before adding new ones
    ["experiment_name", "variation_name", "visitor_id"].forEach(param => queryParams.delete(param));
    // Add current PageSense experiment parameters
    queryParams.set("experiment_name", experimentName);
    queryParams.set("variation_name", variationName);
    queryParams.set("visitor_id", visitorId);
    // Construct final URL string
    const finalUrl = baseUrl + "?" + queryParams.toString();
    console.debug("[PageSense] A/B test parameters appended successfully.");
    return finalUrl;
    } catch (error) {
    // Fail-safe: return the original URL if any unexpected error occurs
    console.error("[PageSense] Unexpected error while appending A/B test parameters:", error);
    return inputUrl;
    }
    };
    // --------------------------------------------------------------------
    // Script Initialisation Log
    // --------------------------------------------------------------------
    console.info("[PageSense] PageSenseUtils initialised and ready for use.");
   })(window);