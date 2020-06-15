/*******************************************************************************************************************************************************************************************************************
'  Function Name   : libSort.js
'  Author          : Tyeware Pty Ltd - Thomas Royle
'  Creation Date   : 10/05/2018
'  
'  Description     : Converts any given report into a sortable report.
'  
'  How To Run:
'-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
'  1. Ensure moment.js and libSort.js are imported. moment.js must come first in the import list.
   2. Assign class values to report to mark as placeholders.
'  4. Against the wrapper element (this is the element is which all the sortable object are contained.
'          
'          $(<wrapper element>).sort({<settings>});
'  
'  5. The results should now display ordering arrows, ready to activate on click.
'
'  Sorting Arrows:
'
'  The sorting arrows are created though two css classes, however these can be specified to any class as you like, being imgArrow and imgArrowLoading. You can assign alternative class names though the following
'
'         cssArrowClass: "<new class name>",
          cssArrowLoadingClass: "<new class name>"
'  
'  Class Name Tree:
'  
'       Wrapper: (This is the object where the .sort() js function is fired)
'       --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
'       |    Header Row:                                                                                                                                                                           |
'       |    ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------    |
'       |    |   - sort-head-<unique header name>           : Place one class of this type in each header column, binding with a unique id of choice.                                         |    |
'       |    ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------    |
'       |    Data Rows:                                                                                                                                                                            |
'       |    ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------    |
'       |    |   # sort-row-<order number>                  : Place one class of this type in each root row element. To group rows together (i.e. In the case of a separator row),            |    |
'       |    |                                                add a group order number to each row. For example, to group a data and separator row add the following classes in order.        |    |
'       |    |                                                                                                                                                                                |    |
'       |    |                                                <tr class="sort-row-1">-------------------------</tr>                                                                           |    |
'       |    |                                                <tr class="sort-row-2">Data goes here...</tr>                                                                                   |    |
'       |    |   -------------------------------------------------------------------------------------------------------------------------------------------------------------------------    |    |
'       |    |   |   # sort-column-<unique header name>     : Place one class of this type in each column element. Bind id with the header column name id created before.                |    |    |
'       |    |   |    -------------------------------------------------------------------------------------------------------------------------------------------------------------      |    |    |
'       |    |   |   |   # sort-data-<data type>            : Place one class of this type against each element containing data used to sort. Not that this cannot be place       |      |    |    |
'       |    |   |   |                                        on the same element containing the sort-column class, it must be with-in it.                                        |      |    |    |
'       |    |   |   |                                        If more than 2 sort-data classes are used within a sort-column element, the data will be converted to text and      |      |    |    |
'       |    |   |   |                                        merged for sorting, regardless of the data type).                                                                   |      |    |    |
'       |    |   |   |   Sort Data Types:                                                                                                                                         |      |    |    |
'       |    |   |   |       - text                         : General text.                                                                                                       |      |    |    |
'       |    |   |   |       - number                       : Numeric value (including %, $ and values with ,)                                                                    |      |    |    |
'       |    |   |   |       - date-<date time format>      : Date values. This is evaluated using moment(<date>, <date format>). By default the date format is DD/MM/YYYY,       |      |    |    |
'       |    |   |   |                                        however, any format applicable to moment.js will apply. To specify a format, append the format after the type       |      |    |    |
'       |    |   |   |                                        name "date-". e.g. for date and time, add the class sort-data-date-DD/MM/YYYY_HH:mm (use _ to represent a space.)   |      |    |    |
'       |    |   |   --------------------------------------------------------------------------------------------------------------------------------------------------------------      |    |    |
'       |    |   -------------------------------------------------------------------------------------------------------------------------------------------------------------------------    |    |
'       --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
'  
'  Options:
'       - order                 : Default order by. Either "asc" (ascending), or "desc" (descending).
'       - orderID               : Default order column ID. This is the <unique header name> value placed in the header class name.
'                                 If a value is provided, the function will automatically order the rows based on the given id.
'       - cssArrowClass         : Class used to specify the up and down arrow image.
'       - cssAlternatingClass   : By default the class is "altItem". This ensures that each row contains alternating background styles for rows. Set as blank to disable the function.
'       - onPreSort             : Called before sorting begins.
'       - onPostSort            : Called after sorting.
'
'-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
'
*******************************************************************************************************************************************************************************************************************/
jQuery.fn.sort = function (settings) {
    //Look for existing object
    if ($(this).data("sort") != null) {
        return $.extend($(this), $(this).data("sort"));
    }

    //Create module
    var module = {
    };

    //Set defaults
    module.options = {
        order: "asc",
        orderID: null,
        dateFormat: "DD/MM/YYYY",
        cssArrowClass: "imgArrow",
        cssArrowLoadingClass: "imgArrowLoading",
        cssAlternatingClass: "altReportRow",
        onpresort: function () { },
        onpostsort: function () { },
        orders: {
            none: "none",
            asc: "asc",
            desc: "desc"
        }
    };

    //Merge settings
    $.extend(module.options, settings);

    //Set objects
    module.self = $(this);
    module.columnsHead = [];
    module.columnsData = [];
    module.timOrder = null;

    //Set events
    module.init = function () {
        //Clear all collected sort objects
        module.clearData();

        //Create header
        module.generateColumnsHead();

        //Create data
        module.generateColumnsData();

        //Assign module to self
        if (module.self.data("sort") == null) {
            module.self.data("sort", module);
        }
    };

    /*************************************************************************
    '  Function Name   : clearData()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Clears the recorded sort list.
    *************************************************************************/
    module.clearData = function () {
        //Clear data
        columnsHead = [];
        columnsData = [];
    };

    /*************************************************************************
    '  Function Name   : generateColumnsHead()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Generates all header associated sort buttons/values.
    *************************************************************************/
    module.generateColumnsHead = function () {
        //Loop though each row and find all columns
        var columns = module.self.find("[class*='sort-head-']");
        for (var i = columns.length - 1; i >= 0; i--) {
            var column = $(columns[i]);

            //Find column id
            var id = column[0].className.substring(column[0].className.indexOf("sort-head-")).replace("sort-head-", "");
            if (id.indexOf(" ") > 0) id = id.substring(0, id.indexOf(" "));

            //Create column arrow
            var imgArrowID = "imgColArrow_" + id;
            var imgArrow = $("<div id=\"" + imgArrowID + "\" class=\"" + module.options.cssArrowClass + "\"></div>");

            //Bind arrow data
            imgArrow.data("order", module.options.order);
            imgArrow.data("orderID", id);

            imgArrow.on("click", function () {
                //Sort results
                module.orderByArrow($(this));
            });

            //Add arrow to column
            column.append(imgArrow);
            column.data("arrowID", imgArrowID);

            //Set column position to relative
            column.css({ position: "relative" });

            //Add column to list
            module.columnsHead.push({
                obj: column,
                id: id,
                order: module.options.order
            });

            //Bind arrows
            module.bindArrows();
        }
    };

    /*************************************************************************
    '  Function Name   : generateColumnsData()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Generates all row values. Binding to the header columns.
    *************************************************************************/
    module.generateColumnsData = function () {
        //Loop though each row and find all rows
        var rows = module.self.find("[class*='sort-row']");
        if (rows.length > 0) {
            //Create row groups
            var groups = [];
            var groupID = 0;

            //Find max row group
            var maxGroupID = [];
            var counter = 0;
            while (counter < rows.length) {
                //Get row number
                var num = rows[counter].className.substring(rows[counter].className.indexOf("sort-row")).replace("sort-row-", "").replace("sort-row", "");
                if (num.indexOf(" ") > -1) num = num.substring(0, num.indexOf(" "));
                if (num == "") num = "1";

                //Set max groupID
                if (parseInt(num) > maxGroupID)
                    maxGroupID = parseInt(num);
                else
                    break;

                //Increment the counter
                counter++;
            }

            var i = 0;
            while (i < rows.length) {
                var rowData = [];
                var rowSep = [];
                var group = {
                    groupID: groupID,
                    dataRow: null,
                    sepRows: []
                };

                for (var g = 0; g < maxGroupID; g++) {
                    //Find all row columns
                    var row = $(rows[i]);
                    var columns = row.find("[class*='sort-column']");

                    //Determine whether the row is a data or separator row
                    if (columns.length > 0) {
                        //Data row
                        var rowColumns = [];
                        for (var c = columns.length - 1; c >= 0; c--) {
                            //Find all data values in column
                            var column = $(columns[c]);
                            var columnData = column.find("[class*='sort-data']");

                            //Ensure the column itself is not a data class
                            if (columnData.length <= 0) {
                                if (column[0].className.indexOf("sort-data") > -1) columnData = column;
                            }

                            //Find column id
                            var id = column[0].className.substring(column[0].className.indexOf("sort-column-")).replace("sort-column-", "");
                            if (id.indexOf(" ") > 0) id = id.substring(0, id.indexOf(" "));

                            //Create data string from column
                            var data = "";
                            var columnType = "";
                            var type = "";
                            for (var n = 0; n < columnData.length; n++) {
                                if (data != "") data += ", ";
                                type = "";

                                //Get data type
                                type = module.formatType(columnData[n].className);

                                //Process string
                                var dataValue = $(columnData[n]).html() != "" ? $(columnData[n]).html() : $(columnData[n]).val();

                                //Append data to list
                                data += module.processValue(dataValue, type);

                                //Set column type
                                if (columnType == "") {
                                    if (columnData.length > 1)
                                        columnType = "text";
                                    else
                                        columnType = type;
                                }
                            }

                            //Add to column list
                            rowColumns.push({
                                obj: column,
                                id: id,
                                value: data,
                                type: columnType
                            });
                        }

                        //Add row to data rows
                        group.dataRow = {
                            obj: row,
                            columns: rowColumns
                        };
                    } else {
                        //Separator row
                        group.sepRows.push({
                            type: group.dataRow != null ? "post" : "pre",
                            obj: row
                        });
                    }

                    //Increment i
                    i++;
                }

                //Add group to list
                groups.push(group);

                //Increment groupID
                groupID++;
            }

            //Add groups to list
            module.columnsData = groups;
        }
    };

    /*************************************************************************
    '  Function Name   : bindArrows()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Binds the up and down arrows for the sort headers.
    '                    
    '  Input           : orderID    : Column id to sort against.
    '  Output          : None
    *************************************************************************/
    module.bindArrows = function (orderID) {
        for (var i = 0; i < module.columnsHead.length; i++) {
            //Bind arrow
            var arrow = $("#" + module.columnsHead[i].obj.data("arrowID"));
            if (arrow.length > 0) {
                //Reset other non selected columns
                if (module.columnsHead[i].id != orderID) {
                    arrow.data("order", module.options.orders.none);
                }

                //Set arrow order attribute
                var order = arrow.data("order");
                arrow.prop("column-order", order);
                arrow.attr("column-order", order);
            }
        }
    };

    /*************************************************************************
    '  Function Name   : orderByArrow()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Fired when a sort arrow is selected.
    '                    
    '  Input           : arrow      : Arrow object used to indicate ascending or descending order.
    '                    isContinue : If this is not given, then the function adds a 100 millisecond delay on the function call.
    '                                 This is used to stop duplicates and double selects.
    '  Output          : None
    *************************************************************************/
    module.orderByArrow = function (arrow, isContinue) {
        if (!isContinue) {
            //Set loading
            module.setLoading(arrow, true);

            //Set onclick
            if (!module.timOrder) {
                clearTimeout(module.timOrder);
                module.timOrder = null;
            }

            //Create new timeout
            module.timOrder = setTimeout(function () { module.orderByArrow(arrow, true); }, 100);
        } else {
            //Call presort
            module.options.onpresort();

            //get order
            var order = arrow.data("order");
            var orderID = arrow.data("orderID");

            //Reverse order
            switch (order) {
                case module.options.orders.none:
                    order = module.options.order
                    break;
                case module.options.orders.asc:
                    order = module.options.orders.desc;
                    break;
                case module.options.orders.desc:
                    order = module.options.orders.asc;
                    break;
            };

            //Bind column data
            arrow.data("order", order);
            arrow.data("orderID", orderID);

            //Bind sort arrows
            module.bindArrows(orderID);

            //Sort results
            module.sortData(orderID, order);

            //Set loading
            module.setLoading(arrow, false);

            //Call postSort
            module.options.onpostsort();
        }
    };

    /*************************************************************************
    '  Function Name   : sortData()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Sorts the given wrapper list.
    '                    
    '  Input           : orderID    : The id of the preferred column to sort on.
    '                                 If none is given, then the default is selected.
    '                    order      : The preferred order to sort on. If none is given,
    '                                 then the default for the column is used.
    '  Output          : None
    *************************************************************************/
    module.sortData = function (orderID, order) {
        if (!order) order = module.options.order;
        if (!orderID) orderID = module.options.orderID;

        //Sort rows
        module.columnsData = module.sortArray(module.columnsData, orderID, order);

        //Bind sorted values
        module.bindOrder();
    };

    /*************************************************************************
    '  Function Name   : sortArray()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Sorts the given array.
    '                    
    '  Input           : arr        : Array to sort.
    '                    orderID    : Column id to sort against.
    '                    order      : Order in which to sort.
    '  Output          : None
    *************************************************************************/
    module.sortArray = function (arr, orderID, order) {
        //Check whether the data rows can be sorted by the id
        if (module.getRowColumnByID(arr[0].dataRow.columns, orderID)) {
            //Sort row by order ID
            arr.sort(function (a, b) {
                //Get values
                var col1 = module.getRowColumnByID(a.dataRow.columns, orderID);
                var col2 = module.getRowColumnByID(b.dataRow.columns, orderID);
                var r1, r2;

                //Convert values based on value type
                if (col1.type == "number") {
                    //Data type number
                    r1 = parseFloat(col1.value);
                    r2 = parseFloat(col2.value);

                    //Validate number
                    if (isNaN(r1) || isNaN(r2)) {
                        col1.type = "text";
                        col2.type = "text";
                    }
                } else if (col1.type.substring(0, 4) == "date") {
                    //Data type date
                    var dateFormat = module.options.dateFormat;
                    if (col1.type.indexOf("-") > -1) dateFormat = col1.type.substring(col1.type.indexOf("-") + 1)

                    //Alter blank dates
                    if (col1.value == "") col1.value = moment("01/01/1999", "DD/MM/YYYY").format(dateFormat);
                    if (col2.value == "") col2.value = moment("01/01/1999", "DD/MM/YYYY").format(dateFormat);

                    r1 = moment(col1.value, dateFormat);
                    r2 = moment(col2.value, dateFormat);

                    //Validate date
                    if (r1 && r2) {
                        if ((!r1.isValid()) || (!r2.isValid())) {
                            col1.type = "text";
                            col2.type = "text";
                        }
                    } else {
                        col1.type = "text";
                        col2.type = "text";
                    }
                }

                //Set values to text if needed
                if ((r1 == null && r2 == null) || (col1.type == "text")) {
                    //Data type text
                    r1 = col1.value.toLowerCase();
                    r2 = col2.value.toLowerCase();
                }

                //Compare values
                if (col1.type.substring(0, 4) != "date") {
                    if (r1 < r2)
                        return -1;
                    if (r1 > r2)
                        return 1;
                } else {
                    if (r1.isBefore(r2))
                        return -1;
                    if (r1.isAfter(r2))
                        return 1;
                }

                //Return nothing if equal
                return 0;
            });

            //Set order
            if (order == "desc")
                arr.reverse();
        }

        return arr;
    };

    /*************************************************************************
    '  Function Name   : getRowColumnByID()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Collects a column from a given row and orderID.
    '                    
    '  Input           : columns    : List of columns to search against.
    '                    id         : column id to search for.
    '  Output          : None
    *************************************************************************/
    module.getRowColumnByID = function (columns, id) {
        var column = null;

        //Find value from name
        for (var i = 0; i < columns.length; i++) {
            if (columns[i].id == id) {
                column = columns[i];
                break;
            }
        }

        return column;
    };

    /*************************************************************************
    '  Function Name   : bindOrder()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Binds the ordered array to the report.
    *************************************************************************/
    module.bindOrder = function () {
        //Loop though all the rows and look for the first order value
        for (var i = 0; i < module.columnsData.length; i++) {
            var objParent = module.columnsData[i].dataRow.obj.parent();
            var group = module.columnsData[i];

            //Add pre separators
            for (var c = 0; c < group.sepRows.length; c++) {
                if (group.sepRows[c].type == "pre") {
                    group.sepRows[c].obj.detach();
                    objParent.append(group.sepRows[c].obj);
                }
            }

            //Add data row
            if (group.dataRow) {
                //Detach data row
                module.columnsData[i].dataRow.obj.detach();

                //Bind row alt item
                group.dataRow.obj.removeClass(module.options.cssAlternatingClass);
                if ((module.options.cssAlternatingClass != "") && (module.options.cssAlternatingClass != null)) {
                    if (i % 2 != 0) group.dataRow.obj.addClass(module.options.cssAlternatingClass);
                }

                //Add data row
                objParent.append(group.dataRow.obj);
            }

            //Add post separators
            for (var c = 0; c < group.sepRows.length; c++) {
                if (group.sepRows[c].type == "post") {
                    group.sepRows[c].obj.detach();
                    objParent.append(group.sepRows[c].obj);
                }
            }
        }
    };

    /*************************************************************************
    '  Function Name   : formatType()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Formats the given class into a data type.
    '                    
    '  Input           : className  : Class name of the data column to extract the data type from.
    '  Output          : None
    *************************************************************************/
    module.formatType = function (className) {
        //Find sort-data class, and remove sort-data- text
        var type = className.substring(className.indexOf("sort-data")).replace("sort-data-", "").replace("sort-data", "");

        //Trim whitespace
        type = type.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        //Format date type, replacing _ with " "
        if (type.substring(0, 4) == "date") type = module.replaceAll(type, "_", " ");

        //Set default if there is no text
        if (type == "") type = "text";

        return type;
    };

    /*************************************************************************
    '  Function Name   : processValue()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Processes the given data values to ensure they are
    '                    suitable for sorting.
    '                    
    '  Input           : value      : Value to process.
    '                    type       : Data type of the value processing. This can be either;
                                        - text
                                        - number
                                        - date
    '  Output          : None
    *************************************************************************/
    module.processValue = function (value, type) {
        //Remove returns, and convert whitespace, convert to lower case 
        value = module.replaceAll(module.replaceAll(value, "\n", ""), "nbsp;", " ").toLowerCase();

        //Trim edges
        value = value.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        //Remove all whitespace if text
        if (type == "text")
            value = module.replaceAll(value, " ", "");

        //Trim values for number
        if (type == "number")
            value = module.replaceAll(module.replaceAll(module.replaceAll(value, ",", ""), "%", ""), "$", "");

        return value;
    };

    /*************************************************************************
    '  Function Name   : setLoading()
    '  Author          : Thomas Royle - Tyeware Pty Ltd
    '  Creation Date   : 10/05/2018
    '
    '  Description     : Sets the given arrow to loading or complete.
    '                    
    '  Input           : arrow      : Arrow object used to indicate ascending or descending order.
    '                    isLoading  : Indicates wether the arrow is loading or not.
    '  Output          : None
    *************************************************************************/
    module.setLoading = function (arrow, isLoading) {
        //Set arrow order attribute
        if (isLoading) {
            arrow.addClass(module.options.cssArrowLoadingClass);
        } else {
            arrow.removeClass(module.options.cssArrowLoadingClass);
        }
    };

    module.replaceAll = function (val, oldString, newString) {
        return val.replace(new RegExp(oldString, 'ig'), newString);
    };

    //Init sort
    module.init();
};
