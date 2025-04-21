/**
 * Filters functionality for Adobe Creative Cloud Connector
 * This module handles fetching, displaying, and applying filters to search results
 */

// Global variables to store filter data
let filters = [];
let selectedFilters = {};
let filtersVisible = false;

/**
 * Fetches filter data from the IntelligenceBank API
 * @param {string} apiKey - The API key
 * @param {string} userUuid - The cliend id
 * @param {string} sessionKey - The session key
 * @param {string} apiUrl - The API URL
 * @param {function} callback - Callback function to handle the response
 */
function fetchFilters(apiKey, userUuid, sessionKey, apiUrl, callback) {
    const path = "/api/3.0.0/" + userUuid + "/resource?productkey=0db17b942ed391096168f41f90051acc&action=get_custom_upload_fields_info&verbose";
    
    const options = {
        rejectUnauthorized: false,
        method: 'GET',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey
        }
    };

    request.get(options, function(error, response, body) {
        if (error) {
            callback({
                error: "err:" + error
            });
            return;
        }
let parseError = false;


        try {
            body = JSON.parse(body);
            if (body.error) parseError = body.error;
        } catch(e) {
            parseError = "Invalid response";
            callback({
                error: parseError
            });
            return;
        }

        callback({
            error: parseError,
            body: body
        });
    });
}

/**
 * Process the filter data from the API response
 * @param {Object} data - The API response data
 * @returns {Array} - Processed filters array
 */
function processFilters(data) {
    const processedFilters = [];
    
    // Process global filters
    if (data.response && data.response.filters) {
        data.response.filters.forEach(filter => {
            if (!filter.tools.includes('resource')) return; // Only process filters for resources
            
            processedFilters.push({
                id: filter._id,
                name: filter.name.en, // Using English name
                field: `ib_filters_${filter._id}`,
                multiple: true, // Always set to true for search purposes
                values: filter.filterValues.map(value => ({
                    uuid: value.uuid,
                    label: value.value.en // Using English value
                }))
            });
        });
    }
    
    // Process form data fields
    if (data.response && data.response.formData) {
        let fields = [];
        if (data.response.formData.tabs && data.response.formData.tabs[0]) {
            let tab = data.response.formData.tabs[0].uuid;
            if (tab && data.response.formData.sections[tab] && data.response.formData.sections[tab][0]) {
                let section = data.response.formData.sections[tab][0].uuid;
                if (section && data.response.formData.fields[section]) {
                    fields = data.response.formData.fields[section];
                }
            }
        }
        
        fields.forEach(field => {
            if (!['select', 'multiSelect', 'checkbox', 'radio'].includes(field.type)) return;
            
            let fieldTemplate = field.type === 'select' || field.type === 'radio' ? 
                `${field.uuid}_s_ib` : `${field.uuid}_ss_ib`;
            
            if (field.source === 'customList') {
                processedFilters.push({
                    id: field.uuid,
                    name: field.label,
                    field: fieldTemplate,
                    multiple: true, // Always set to true for search purposes
                    values: field.customList.map(value => ({
                        uuid: value.uuid,
                        label: value.value
                    }))
                });
            } else if (field.source === 'filters' && field.ibfilters) {
                const linkedFilter = data.response.filters.find(f => f._id === field.ibfilters);
                if (linkedFilter) {
                    processedFilters.push({
                        id: field.uuid,
                        name: field.label,
                        field: fieldTemplate,
                        multiple: true, // Always set to true for search purposes
                        values: linkedFilter.filterValues.map(value => ({
                            uuid: value.uuid,
                            label: value.value.en
                        }))
                    });
                }
            }
        });
    }
    
    // Sort filters alphabetically by name
    return processedFilters.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Creates the filters UI elements
 * @returns {HTMLElement} - The filters container element
 */
function createFiltersUI() {
    // Create sample filters for testing if no real filters are available
    const sampleFilters = [
        {
            id: 'activity',
            name: 'Activity',
            field: 'activity_s_ib',
            multiple: false,
            values: [
                { uuid: 'digging', label: 'Digging' },
                { uuid: 'running', label: 'Running' },
                { uuid: 'swimming', label: 'Swimming' }
            ]
        },
        {
            id: 'brands',
            name: 'Brands',
            field: 'brands_ss_ib',
            multiple: true,
            values: [
                { uuid: 'brand1', label: 'Brand 1' },
                { uuid: 'brand2', label: 'Brand 2' },
                { uuid: 'brand3', label: 'Brand 3' }
            ]
        },
        {
            id: 'orientation',
            name: 'Orientation',
            field: 'orientation_s_ib',
            multiple: false,
            values: [
                { uuid: 'landscape', label: 'Landscape' },
                { uuid: 'portrait', label: 'Portrait' },
                { uuid: 'square', label: 'Square' }
            ]
        },
        {
            id: 'products',
            name: 'Products',
            field: 'products_ss_ib',
            multiple: true,
            values: [
                { uuid: 'product1', label: 'Product 1' },
                { uuid: 'product2', label: 'Product 2' },
                { uuid: 'product3', label: 'Product 3' }
            ]
        },
        {
            id: 'region',
            name: 'Region',
            field: 'region_s_ib',
            multiple: false,
            values: [
                { uuid: 'na', label: 'North America' },
                { uuid: 'eu', label: 'Europe' },
                { uuid: 'asia', label: 'Asia' }
            ]
        },
        {
            id: 'resourceTypes',
            name: 'Resource Types',
            field: 'resourceTypes_ss_ib',
            multiple: true,
            values: [
                { uuid: 'image', label: 'Image' },
                { uuid: 'video', label: 'Video' },
                { uuid: 'document', label: 'Document' }
            ]
        }
    ];
    
    // Use sample filters if no real filters are available
    const filtersToUse = filters.length > 0 ? filters : sampleFilters;
    
    // Create the container using Materialize card
    const filtersContainer = document.createElement('div');
    filtersContainer.id = 'filters-container';
    filtersContainer.className = 'card';
    filtersContainer.style.margin = '0';
    filtersContainer.style.borderRadius = '0';
    // Remove inline positioning styles - these are now handled in CSS
    
    // Create card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    cardContent.style.padding = '15px';
    
    // Create title and buttons row
    const titleRow = document.createElement('div');
    titleRow.className = 'row';
    titleRow.style.marginBottom = '15px';
    
    // Title column
    const titleCol = document.createElement('div');
    titleCol.className = 'col s6';
    
    const title = document.createElement('span');
    title.className = 'card-title';
    title.style.fontSize = '16px';
    title.style.fontWeight = 'bold';
    title.style.marginTop = '0';
    title.textContent = 'Filters';
    
    titleCol.appendChild(title);
    
    // Buttons column
    const buttonsCol = document.createElement('div');
    buttonsCol.className = 'col s6 right-align';
    
    // Clear button
    const clearButton = document.createElement('a');
    clearButton.className = 'btn-flat waves-effect waves-light clear-all-btn';
    clearButton.style.padding = '0 10px';
    clearButton.style.color = '#9acc65';
    clearButton.style.fontWeight = '500';
    clearButton.style.fontSize = '0.9rem';
    clearButton.style.textTransform = 'uppercase';
    clearButton.textContent = 'Clear All';
    clearButton.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        clearAllFilters();
    };
    
    // Close button
    const closeButton = document.createElement('a');
    closeButton.className = 'btn-flat waves-effect waves-light close-filters-btn';
    closeButton.style.padding = '0 10px';
    closeButton.style.marginLeft = '5px';
    closeButton.innerHTML = '<i class="material-icons" style="color: #9acc65; font-size: 18px;">close</i>';
    closeButton.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        hideFilters();
    };
    
    // Add buttons to column
    buttonsCol.appendChild(clearButton);
    buttonsCol.appendChild(closeButton);
    // Add columns to row
    titleRow.appendChild(titleCol);
    titleRow.appendChild(buttonsCol);
    
    // Add row to card content
    cardContent.appendChild(titleRow);
    
    
    // Create filters row
    const filtersRow = document.createElement('div');
    filtersRow.className = 'row';
    filtersRow.style.marginBottom = '0';
    
    // Add filters to the row
    // Add filters to the row
    filtersToUse.forEach(filter => {
        // Create column for each filter
        const filterCol = document.createElement('div');
        filterCol.className = 'col s12 m6';
        
        // Create input field
        const inputField = document.createElement('div');
        inputField.className = 'input-field';
        
        // Create select element
        const select = document.createElement('select');
        select.id = `filter-${filter.id}`;
        select.setAttribute('data-filter-id', filter.id);
        select.setAttribute('data-filter-field', filter.field);
        
        // Make all filters multi-select for search purposes
        select.setAttribute('multiple', '');
        
        // For multiple selects, add a placeholder option that's not selectable
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = `Select ${filter.name}...`;
        placeholderOption.disabled = true;
        select.appendChild(placeholderOption);
        // Add options
        filter.values.forEach(value => {
            const option = document.createElement('option');
            option.value = value.uuid;
            option.textContent = value.label;
            select.appendChild(option);
        });
        
        // Create label
        const label = document.createElement('label');
        label.htmlFor = `filter-${filter.id}`;
        label.textContent = filter.name;
        
        // Add select and label to input field
        inputField.appendChild(select);
        inputField.appendChild(label);
        
        // Add input field to column
        filterCol.appendChild(inputField);
        
        // Add column to row
        filtersRow.appendChild(filterCol);
    });
    
    // Add filters row to card content
    cardContent.appendChild(filtersRow);
    
    // Add card content to container
    filtersContainer.appendChild(cardContent);
    
    return filtersContainer;
}

/**
 * Shows the filters UI
 */
function showFilters() {
    // Add class to body to prevent scrolling
    document.body.classList.add('filters-open');
    if (!filtersVisible) {
        const searchInput = document.querySelector('.search_input');
        if (searchInput) {
            // Create filters container if it doesn't exist
            const filtersContainer = document.getElementById('filters-container') || createFiltersUI();
            
            // Position the filters container right below the search bar
            const searchBar = document.querySelector('.header');
            if (searchBar) {
                // Insert after the header but before the navigation
                const navigation = document.querySelector('.navigation');
                if (navigation) {
                    navigation.parentNode.insertBefore(filtersContainer, navigation);
                } else {
                    searchBar.parentNode.insertBefore(filtersContainer, searchBar.nextSibling);
                }
            } else {
                searchInput.parentNode.insertBefore(filtersContainer, searchInput.nextSibling);
            }
            
            // Hide the search results bar when filters are shown
            const searchResults = document.querySelector('.navigation.row');
            if (searchResults) {
                searchResults.style.display = 'none';
            }
            
            // Make sure the search bar, search icon, and filter toggle remain visible and usable
            const searchIcon = document.querySelector('.search_btn');
            if (searchIcon) {
                searchIcon.style.zIndex = '1001'; // Higher than the filters container
                searchIcon.style.position = 'relative'; // Ensure it's visible
                searchIcon.style.display = 'block'; // Make sure it's visible
            }
            
            // Ensure filter toggle button remains visible
            const filterToggle = document.querySelector('.filter-toggle-btn');
            if (filterToggle) {
                filterToggle.style.zIndex = '1001';
                filterToggle.style.position = 'relative';
                filterToggle.classList.add('active');
            }
            
            // Initialize Materialize selects after the container is added to the DOM
            setTimeout(() => {
                // Set values from selectedFilters before initializing
                for (const [field, values] of Object.entries(selectedFilters)) {
                    const select = $(`select[data-filter-field="${field}"]`);
                    if (select.length) {
                        select.val(values);
                    }
                }
                
                // Initialize only the filter selects with tooltips disabled
                $('#filters-container select').material_select({
                    // Disable tooltips to reduce console messages
                    tooltip: false
                });
                
                // Add change event listeners to all selects
                $('select').off('change').on('change', function() {
                    const filterField = $(this).data('filter-field');
                    const selectedValues = $(this).val() || [];
                    
                    if (selectedValues.length > 0) {
                        selectedFilters[filterField] = selectedValues;
                    } else {
                        delete selectedFilters[filterField];
                    }
                    
                    // Update filter indicator
                    updateFilterIndicator();
                });
            }, 100);
            
            filtersVisible = true;
        }
    }
}

/**
 * Hides the filters UI
 */
function hideFilters() {
    // Remove class from body to allow scrolling again
    document.body.classList.remove('filters-open');
    
    const filtersContainer = document.getElementById('filters-container');
    if (filtersContainer) {
        // Destroy only the filter selects before removing the container
        $('#filters-container select').material_select('destroy');
        filtersContainer.remove();
        filtersVisible = false;
        
        // Show the search results bar again
        const searchResults = document.querySelector('.navigation.row');
        if (searchResults) {
            searchResults.style.display = '';
        }
        
        // Make sure search icon remains visible
        const searchIcon = document.querySelector('.search_btn');
        if (searchIcon) {
            searchIcon.style.zIndex = '1001';
            searchIcon.style.position = 'relative';
            searchIcon.style.display = 'block';
        }
        
        // Remove active class from filter toggle button
        const filterToggle = document.querySelector('.filter-toggle-btn');
        if (filterToggle) {
            filterToggle.classList.remove('active');
        }
    }
}

/**
 * Clears all selected filters
 */
function clearAllFilters() {
    selectedFilters = {};
    
    // Reset all select elements
    $('#filters-container select').each(function() {
        // Reset to default value
        if ($(this).attr('multiple')) {
            $(this).val([]);
        } else {
            $(this).val('');
        }
        
        // Destroy and reinitialize Materialize select to ensure proper reset
        $(this).material_select('destroy');
        $(this).material_select({
            // Disable tooltips to reduce console messages
            tooltip: false
        });
    });
    
    // Update filter indicator
    updateFilterIndicator();
    
    // Reset search placeholder
    const searchInput = document.querySelector('.search_input input');
    if (searchInput) {
        searchInput.setAttribute('placeholder', 'Search this area...');
    }
    
    console.log('All filters cleared');
}

/**
 * Updates the filter indicator in the search input
 */
function updateFilterIndicator() {
    const searchInput = document.querySelector('.search_input');
    if (searchInput) {
        const filterCount = Object.keys(selectedFilters).length;
        
        // Remove existing badges
        const existingBadges = document.querySelectorAll('.filter-badge');
        existingBadges.forEach(badge => badge.remove());
        
        if (filterCount > 0) {
            const inputField = searchInput.querySelector('input');
            if (inputField) {
                // Add filter icon to input
                inputField.classList.add('has-filters');
                
                // Create a small dot indicator on the filter icon
                const filterToggle = document.querySelector('.filter-toggle-btn i');
                if (filterToggle) {
                    // Create a small dot indicator
                    const indicator = document.createElement('span');
                    indicator.className = 'filter-badge';
                    indicator.style.position = 'absolute';
                    indicator.style.width = '8px';
                    indicator.style.height = '8px';
                    indicator.style.borderRadius = '50%';
                    indicator.style.backgroundColor = '#9acc65';
                    indicator.style.top = '0';
                    indicator.style.right = '0';
                    
                    // Make sure the parent has position relative
                    filterToggle.style.position = 'relative';
                    filterToggle.appendChild(indicator);
                }
                
                // Update placeholder
                inputField.setAttribute('placeholder', 'Search with filters...');
            }
        } else {
            const inputField = searchInput.querySelector('input');
            if (inputField) {
                inputField.classList.remove('has-filters');
                inputField.setAttribute('placeholder', 'Search this area...');
            }
        }
    }
}

/**
 * Applies selected filters to the search query
 * @param {Object} searchParams - The search parameters object
 * @returns {Object} - Updated search parameters with filters
 */
function applyFiltersToSearch(searchParams) {
    // Always return the search params even if no filters are selected
    // This allows searching with just filters and no keywords
    
    // Initialize wrapped_conditions if it doesn't exist
    if (!searchParams.wrapped_conditions) {
        searchParams.wrapped_conditions = [[]];
    }
    
    // Add filter conditions if any are selected
    if (Object.keys(selectedFilters).length > 0) {
        // Add filter conditions
        for (const [field, values] of Object.entries(selectedFilters)) {
            if (values.length > 0) {
                searchParams.wrapped_conditions[0].push({
                    field: field,
                    op: 'in',
                    union: 'and',
                    value: Array.isArray(values) ? values.join(',') : values
                });
            }
        }
        
        // Log the applied filters for debugging
        console.log('Applied filters:', selectedFilters);
        console.log('Updated search params:', searchParams);
    }
    
    return searchParams;
}

/**
 * Initializes the filters functionality
 * @param {Object} appState - The application state
 * @param {function} callback - Callback function when initialization is complete
 */
function initFilters(appState, callback) {
    fetchFilters(appState.apiKey, appState.userUuid, appState.sessionKey, appState.apiUrl, function(response) {
        if (!response.error && response.body) {
            filters = processFilters(response.body);
            
            // CSS is now in style_filters.css
            
            if (callback) callback(true);
        } else {
            console.error('Error fetching filters:', response.error);
            if (callback) callback(false);
        }
    });
}

// Export functions for use in main.js
window.Filters = {
    init: initFilters,
    show: showFilters,
    hide: hideFilters,
    clear: clearAllFilters,
    apply: applyFiltersToSearch
};