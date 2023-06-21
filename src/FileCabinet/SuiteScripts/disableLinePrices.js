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
            var entityID = currentRecord.getValue({ fieldId: 'entity' });

            if (entityID == 4046) {
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
            if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'item') {

                linePrices(scriptContext)
            }
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
                var currentSublistName = scriptContext.sublistId;
                var currentFieldName = scriptContext.fieldId;
                var sublistName = 'item';
                if (currentFieldName == 'entity') {
                    var entityID = currentRecord.getValue({ fieldId: currentFieldName });

                    if (entityID == 4046) {
                        currentRecord.getField({
                            fieldId: "discountitem"
                        }).isDisabled = true
                        currentRecord.getField({
                            fieldId: "discountrate"
                        }).isDisabled = true

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
            var currentRecord = scriptContext.currentRecord;

            var currentLineIndex = currentRecord.getCurrentSublistIndex({
                sublistId: 'item'
            });
            var entityID = currentRecord.getValue({ fieldId: 'entity' });

            var price = currentRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'price',
                line: currentLineIndex
            });

            if (price != -1 && price != 1) {

                dialog.alert({
                    title: "Не може да слагате отстъпка на реда!",
                    message: "За клиентът не е приложима отстъпка!"
                })
                return false
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

        function linePrices(scriptContext) {
            var currentRecord = scriptContext.currentRecord;
            var sublistId = scriptContext.sublistId;

            var currentLineIndex = currentRecord.getCurrentSublistIndex({
                sublistId: sublistId
            });
            var entityID = currentRecord.getValue({ fieldId: 'entity' });

            if (entityID == 4046) {
                currentRecord.getSublistField({
                    sublistId: sublistId,
                    fieldId: 'price',
                    line: currentLineIndex
                }).isDisabled = true;

                if (currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'price',
                    line: currentLineIndex
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

        return {
            pageInit: pageInit,
            postSourcing: postSourcing,
            lineInit: lineInit,
            fieldChanged: fieldChanged,
            validateLine: validateLine
        };

    });
