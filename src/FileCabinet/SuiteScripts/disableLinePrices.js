/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/error',
    './SetLineItemBasePrice_Configuration',
    'N/runtime',
    'N/log',
    'N/search',
    'N/ui/dialog'
],
    function (
        error,
        config,
        runtime,
        log,
        search,
        dialog
    ) {

        var parameters = null;

        function isEmpty(f) { return (f == null || f == ''); }

        function lineInit(scriptContext) {
            try {
                linePrices(scriptContext)

            } catch (err) {
                log.error('Error Line Init', err)
            }
        }

        function fieldChanged(context) {
            var currentRecord = context.currentRecord;
            var currentSublistName = context.sublistId;
            var currentFieldName = context.fieldId;
            var sublistName = 'item';

            if (
                currentSublistName === sublistName &&
                currentFieldName === config.LINE_FIELDS.ITEM
            ) {
                try {
                    setItemBasePrice(currentRecord, sublistName);
                } catch (e) {
                    log.debug({
                        title: config.APP.NAME,
                        details: 'Unable to set Item Base Price, error: ' + JSON.stringify(e)
                    });
                }
            } else if (
                currentSublistName === sublistName &&
                currentFieldName === config.LINE_FIELDS.ADVANCE_INVOICE
            ) {
                try {
                    var item = currentRecord.getCurrentSublistValue({
                        sublistId: currentSublistName,
                        fieldId: 'item'
                    });

                    if (item === parameters[config.SCRIPT_PARAMETERS.ADVANCE_ITEM_703] ||
                        item === parameters[config.SCRIPT_PARAMETERS.ADVANCE_ITEM_703]
                    ) {

                        var advanceInvoiceID = currentRecord.getCurrentSublistValue({
                            sublistId: currentSublistName,
                            fieldId: config.LINE_FIELDS.ADVANCE_INVOICE
                        });
                        var lineJournal = currentRecord.getCurrentSublistValue({
                            sublistId: currentSublistName,
                            fieldId: config.LINE_FIELDS.INVOICE_JOURNAL
                        });

                        if (!lineJournal) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: currentSublistName,
                                fieldId: config.LINE_FIELDS.INVOICE_JOURNAL,
                                value: loadSearchForJounalID(advanceInvoiceID),
                                ignoreFieldChange: true
                            });
                        }

                    }

                } catch (e) {
                    log.debug({
                        title: config.APP.NAME,
                        details: 'Unable to get line Invoice ID ' + JSON.stringify(e)
                    });
                }

            } else if (currentSublistName === sublistName &&
                currentFieldName === 'price') {
                if (checkIfEntityIsStock(context)) {
                    var price = currentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'price'
                    });

                    if (price != '-1' && price != '1') {

                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'price',
                            value: 1,
                            ignoreFieldChange: false
                        });

                        throwUIError(true)
                    }
                }
            }
        }




        function setItemBasePrice(record, sublistName) {
            var fieldValues = getFieldValues(record, sublistName);

            if (!fieldValues[config.BODY_FIELDS.CURRENCY]) return;
            if (!fieldValues[config.LINE_FIELDS.ITEM]) return;

            var itemBasePrice = getItemBasePrice(
                fieldValues[config.LINE_FIELDS.ITEM],
                fieldValues[config.BODY_FIELDS.CURRENCY]
            );

            if (itemBasePrice) {
                record.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: config.LINE_FIELDS.BASE_PRICE,
                    value: itemBasePrice
                });
            }
        }

        function getItemBasePrice(item, currency) {
            var result = null;

            var searchFilters = buildSearchFilters(item, currency)

            var searchResults = loadSearch(
                parameters[config.SCRIPT_PARAMETERS.BASE_PRICE_SS],
                searchFilters
            )

            if (searchResults.rows.length > 0) {
                var searchResult = searchResults.rows[0];
                var searchColumn = searchResults.columns[4];

                result = searchResult.getValue({ name: searchColumn });
                result = parseFloat(result);
                if (isNaN(result)) result = null;
            }

            if (config.APP.IS_DEBUG)
                log.debug({
                    title: config.APP.NAME,
                    details: 'Item Base Price: ' + result + ' for item: ' + item + ' currency: ' + currency
                });

            return result;
        }

        function loadSearchForJounalID(invoiceID) {
            var invoiceSearchObj = search.create({
                type: "invoice",
                filters:
                    [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["item", "anyof", parameters[config.SCRIPT_PARAMETERS.ADVANCE_ITEM]],
                        "AND",
                        ["internalid", "anyof", invoiceID]
                    ],
                columns:
                    [
                        search.createColumn({ name: config.LINE_FIELDS.INVOICE_JOURNAL, label: "Свързан журнал" })
                    ]
            });

            var result = invoiceSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            debugger;
            return result[0].getValue(config.LINE_FIELDS.INVOICE_JOURNAL);
        }

        function buildSearchFilters(item, currency) {
            var searchFilters = [];

            searchFilters.push(
                search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.IS,
                    values: item
                })
            );

            searchFilters.push(
                search.createFilter({
                    name: 'currency',
                    join: 'pricing',
                    operator: search.Operator.IS,
                    values: currency
                })
            );

            return searchFilters;
        }

        function getFieldValues(record, sublistName) {
            var fieldValues = {};

            fieldValues[config.BODY_FIELDS.CURRENCY] =
                parseInt(record.getValue({
                    fieldId: config.BODY_FIELDS.CURRENCY
                }), 10);

            fieldValues[config.LINE_FIELDS.ITEM] =
                parseInt(record.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: config.LINE_FIELDS.ITEM
                }), 10);

            if (config.APP.IS_DEBUG)
                log.debug({
                    title: config.APP.NAME,
                    details: 'Field Values: ' + JSON.stringify(fieldValues)
                });

            return fieldValues;
        }

        function pageInit(scriptContext) {
            try {
                parameters = getScriptParameters();

                var currentRecord = scriptContext.currentRecord;

                if (checkIfEntityIsStock(scriptContext)) {
                    currentRecord.getField({
                        fieldId: "discountitem"
                    }).isDisabled = true
                    currentRecord.getField({
                        fieldId: "discountrate"
                    }).isDisabled = true

                }
            } catch (e) {
                log.debug({
                    title: config.APP.NAME,
                    details: 'Unable to get script parameters, error: ' + JSON.stringify(e)
                });
            }
        }

        function getScriptParameters() {
            var parameters = {};
            var script = runtime.getCurrentScript();

            parameters[config.SCRIPT_PARAMETERS.BASE_PRICE_SS] =
                script.getParameter({ name: config.SCRIPT_PARAMETERS.BASE_PRICE_SS });
            parameters[config.SCRIPT_PARAMETERS.ADVANCE_ITEM] =
                script.getParameter({ name: config.SCRIPT_PARAMETERS.ADVANCE_ITEM });
            parameters[config.SCRIPT_PARAMETERS.ADVANCE_ITEM_702] =
                script.getParameter({ name: config.SCRIPT_PARAMETERS.ADVANCE_ITEM_702 });
            parameters[config.SCRIPT_PARAMETERS.ADVANCE_ITEM_703] =
                script.getParameter({ name: config.SCRIPT_PARAMETERS.ADVANCE_ITEM_703 });

            debugger;
            if (isEmpty(parameters[config.SCRIPT_PARAMETERS.BASE_PRICE_SS])) {
                throw new error.create({
                    name: 'INVALID_PARAMETER',
                    message: 'The ' +
                        config.SCRIPT_PARAMETERS.BASE_PRICE_SS +
                        ' suitelet script parameter is not in a valid format.',
                    notifyOff: false
                });
            }

            if (config.APP.IS_DEBUG)
                log.debug({
                    title: config.APP.NAME,
                    details: 'Script Parameters: ' + JSON.stringify(parameters)
                });

            return parameters;
        }

        function validateLine(context) {
            var currentRecord = context.currentRecord;
            var currentSublistName = context.sublistId;
            var sublistName = 'item';


            if (
                currentSublistName === sublistName
            ) {
                try {
                    setItemBasePrice(currentRecord, sublistName);

                    debugger;

                    if (!checkIfEntityIsStock(context)) {
                        return true
                    }

                    var price = currentRecord.getCurrentSublistValue({
                        sublistId: currentSublistName,
                        fieldId: 'price'
                    });

                    if (price != '-1' && price != '1') {

                        currentRecord.setCurrentSublistValue({
                            sublistId: currentSublistName,
                            fieldId: 'price',
                            value: 1,
                            ignoreFieldChange: false
                        });

                        throwUIError(true)

                    } else {
                        return true
                    }
                } catch (e) {
                    log.debug({
                        title: config.APP.NAME,
                        details: 'Unable to set Item Base Price, error: ' + e.message
                    });
                }
            }

            return true;
        }



        function loadSearch(searchId, searchFilters, limit) {
            limit = limit || Number.POSITIVE_INFINITY;
            var DEFAULT_PAGE_SIZE = 1000;
            var pageSize = (limit < DEFAULT_PAGE_SIZE) ? limit : DEFAULT_PAGE_SIZE;


            var searchObj = search.load({
                id: searchId
            });

            if (searchFilters) {
                searchObj.filters = searchObj.filters.concat(searchFilters);
            }

            var pagedResultSet = searchObj.runPaged({
                pageSize: pageSize
            });

            var rows = [];

            for (var pageNo = 0; pageNo < pagedResultSet.pageRanges.length && pageSize * pageNo <= limit; pageNo++) {

                var currentPage = pagedResultSet.fetch({ index: pagedResultSet.pageRanges[pageNo].index });
                for (var rowNo = 0; rowNo < currentPage.data.length && rows.length < limit; rowNo++) {
                    rows.push(currentPage.data[rowNo]);
                }
            }

            return { columns: searchObj.columns, rows: rows };
        }

        function postSourcing(scriptContext) {
            try {

                var currentRecord = scriptContext.currentRecord;

                var currentFieldName = scriptContext.fieldId;

                if (currentFieldName == 'entity') {
                    var discountItemField = currentRecord.getField({
                        fieldId: "discountitem"
                    });
                    var discountRateField = currentRecord.getField({
                        fieldId: "discountrate"
                    });

                    if (checkIfEntityIsStock(scriptContext)) {

                        discountItemField.isDisabled = true;
                        discountRateField.isDisabled = true;

                    } else {
                        discountItemField.isDisabled = false;
                        discountRateField.isDisabled = false;
                    }
                } else if (scriptContext.fieldId == 'item' && scriptContext.sublistId == 'item') {

                    if (!checkIfEntityIsStock(scriptContext)) {
                        return
                    }
                    if (currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype'
                    })
                        == "Discount") {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: 0,
                        });

                        throwUIError(true)

                    }
                }
            } catch (err) {
                log.error("Post Sourcing Error", err)
            }
        }



        function checkIfEntityIsStock(scriptContext) {
            var currentRecord = scriptContext.currentRecord;
            var entityID = currentRecord.getValue({ fieldId: 'entity' });

            // Проверка дали е "Физическо лице"

            return entityID == 4046
        }
        function linePrices(scriptContext) {
            var currentRecord = scriptContext.currentRecord;
            var sublistId = scriptContext.sublistId;

            var currentLineIndex = currentRecord.getCurrentSublistIndex({
                sublistId: sublistId
            });

            if (checkIfEntityIsStock(scriptContext)) {

                currentRecord.getSublistField({
                    sublistId: sublistId,
                    fieldId: 'price',
                    line: currentLineIndex
                }).isDisabled = true;

                if (currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'price'
                }) != '-1') {
                    currentRecord.getSublistField({
                        sublistId: sublistId,
                        fieldId: 'rate',
                        line: currentLineIndex
                    }).isDisabled = true;

                    currentRecord.getSublistField({
                        sublistId: sublistId,
                        fieldId: 'amount',
                        line: currentLineIndex
                    }).isDisabled = true;
                }

            }
        }

        function throwUIError(discountErr) {
            var title;
            var message;
            if (discountErr) {
                title = "Не може да слагате отстъпка на реда!";
                message = "За клиентът не е приложима отстъпка!";
            }
            dialog.alert({
                title: title,
                message: message
            })
        }

        return {
            fieldChanged: fieldChanged,
            validateLine: validateLine,
            pageInit: pageInit,
            postSourcing: postSourcing,
            lineInit: lineInit
        };
    });
