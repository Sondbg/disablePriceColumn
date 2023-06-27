/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/search', 'N/ui/dialog'],
    /**
     * @param{log} log
     */
    function (log, search, dialog) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            var currentRecord = scriptContext.currentRecord;

            if (checkIfEntityIsStock(scriptContext)) {
                currentRecord.getField({
                    fieldId: "discountitem"
                }).isDisabled = true
                currentRecord.getField({
                    fieldId: "discountrate"
                }).isDisabled = true

            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            // if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'item') {

            //     linePrices(scriptContext)
            // }
        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
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

                    if(!checkIfEntityIsStock){
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

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
            try {
                linePrices(scriptContext)

            } catch (err) {
                log.error('Error Line Init', err)
            }
        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

            var sublistId = scriptContext.sublistId;

            if (sublistId != 'item') {
                return true
            }

            if (!checkIfEntityIsStock(scriptContext)) {
                return true
            }

            var currentRecord = scriptContext.currentRecord;

            var price = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'price'
            });

            if (price != '-1' && price != '1') {

                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'price',
                    value: 1,
                    ignoreFieldChange: false
                });

                throwUIError(true)

            } else {
                return true
            }



        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

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
            pageInit: pageInit,
            postSourcing: postSourcing,
            lineInit: lineInit,
            fieldChanged: fieldChanged,
            validateLine: validateLine
        };

    });
