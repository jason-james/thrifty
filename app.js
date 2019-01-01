
// BUDGET CONTROLLER
var budgetController = (function() { //This is a 'module'. It's an instantly invoked private function, so other modules can't see it

    // Expense object which is stored in exp array below in data object
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calculatePercentage = function (totalIncome) {

        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function () {
        return this.percentage;
    };

    // Income object which is stored in inc array below in data object
    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function (type) {
        var sum = 0;
        data.allItems[type].forEach(function (current) {
            sum += current.value;
        });

        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },

        budget: 0,
        percentage: -1,

    };

    return {
        addItem: function(type, des, val) {
            var newItem;
            var ID = 0;

            // Creates new ID. ID = last ID in array + 1
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            // Makes new items based on type exp or type inc with appropriate object
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }
            // Adds new item to allItems object 
            data.allItems[type].push(newItem);
            return newItem;
        },

        deleteItem: function (type, id) {

            // Loops over the allitems[exp/inc] array and returns an array of the ids 
            var ids = data.allItems[type].map(function (current) {
                return current.id;
            });
            // Gets the index of the ids array to allow us to delete the correct element in the allitems[exp/inc] array
            index = ids.indexOf(id);

            // Removes item with the index of the current id from the allitems[exp/inc] array
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }

        },

        calculateBudget: function () {

            // Calculate total income and total expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate the budget = income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spend
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function () {

            data.allItems.exp.forEach(function (current) {
                current.calculatePercentage(data.totals.exp);
            });

        },

        getPercentages: function () {
            var allPercentages = data.allItems.exp.map(function (current) {
                return current.getPercentage();
            });
            return allPercentages;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage,
            }
        },

    };

})(); 

// UI CONTROLLER
var UIController = (function() {

    var DOMStrings = { // Object to store string names so you can change them all here
        typeInput: '.add__type',
        descriptionInput: '.add__description',
        valueInput: '.add__value',
        buttonInput: '.add__btn',
        incomeContainer: '.income__list', // The INCOME heading on the UI
        expensesContainer: '.expenses__list', // The EXPENSES heading on the UI
        budgetValue: '.budget__value',
        incomeValue: '.budget__income--value',
        expensesValue: '.budget__expenses--value',
        percentageValue: '.budget__expenses--percentage',
        container: '.container',
        expensesPercentageLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    }

    var formatNumber = function(num, type) {
        // Removes any signage from the number
        num = Math.abs(num);
        // Adds two decimal places to the number or rounds to two DP
        num = num.toFixed(2);
        // Splits e.g. 100.0 into 100 as int and 0 as dec 
        var numSplit = num.split('.');
        var int = numSplit[0];
        var dec = numSplit[1];
        // Adds comma for thousands
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); //input 3120, output 3,120
        }

        type === 'exp' ? sign = '-' : sign = '+';

        return sign + ' ' + int + '.' + dec;
    }

    return {
        getInput: function() { // Returning it so that the getInput function object is accessible to all modules via closures. Gets the input values of the selected boxes via .value
            return { // So that we can return all 3 at once to the app controller when we call this, we make it an object
                type: document.querySelector(DOMStrings.typeInput).value, // Will be either 'inc' or 'exp' (as per the html code)
                description: document.querySelector(DOMStrings.descriptionInput).value,
                value: parseFloat(document.querySelector(DOMStrings.valueInput).value),
            }
        },

        addListItem: function (obj, type) {

            // Create HTML string with placeholder text
            var html, newHtml, element;

            if (type === 'inc') {
                element = DOMStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                element = DOMStrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            // Replaces the placeholder text with actual data from our object 
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // Inserts the HTML into the DOM underneath the respective INCOME or EXPENSES heading, as the last element because of beforeend
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function (selectorID) {

            el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);

        },

        clearFields: function () {
            var fields = document.querySelectorAll(DOMStrings.descriptionInput + ', ' + DOMStrings.valueInput);
            // Slice copies arrays, but fields isn't an array so pass it into an array method to return it as an array instead of list
            var fieldsArray = Array.prototype.slice.call(fields);
            // Clears the fields to make them a blank string after finished inputting
            fieldsArray.forEach(function (current, index, array) {
                current.value = '';
            });
            // Switches the highlight back to the description box
            fieldsArray[0].focus();

        },

        displayBudget: function (obj) {

            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMStrings.budgetValue).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMStrings.incomeValue).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMStrings.expensesValue).textContent = formatNumber(obj.totalExp, 'exp');

             if (obj.percentage > 0) {
                document.querySelector(DOMStrings.percentageValue).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMStrings.percentageValue).textContent = '---';
            } 

        },       

        displayPercentages: function (percentages) {

            // Variable to store all the HTML/DOM strings containing the percentage labels
            var fields = document.querySelectorAll(DOMStrings.expensesPercentageLabel);    

            // Function declaration to iterate over the DOM strings in a list, because we can't use forEach with lists, only arrays
            var nodeListForEach = function (list, callback) {
                for (var i = 0; i < list.length; i++) {
                    callback(list[i], i);
                }
            }
            // Function invokation which uses callback to iterate over all items in the DOM list and change the text content of the current element and add the right percentage via the percentages array
             nodeListForEach(fields, function (current, index) {

                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },

        displayDate: function () {
            var now = new Date();
            var months = ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var month = now.getMonth();
            var year = now.getFullYear();
            document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        getDOMStrings: function() { // To make the DOMStrings object accessible by all modules
            return DOMStrings;
        }
    }

})();


// GLOBAL APP CONTROLLER
var appController = (function (UICtrl, budgetCtrl) { // Inputs are added to this one so that this controller knows that the other two modules exist and can connect them. Inputs named differently to the modules so that they're still indepedent, and the names of the other two controllers can change and all you have to do is edit the names when you invoke

    var setupEventListeners = function () {

        //Make DOMStrings from UI controller accessible here
        var DOMStrings = UICtrl.getDOMStrings();
        // Listens for click on adding an item
        document.querySelector(DOMStrings.buttonInput).addEventListener('click', appCtrlAddItem); // Adds button functionality
        // Listens for enter keypress to add item
        document.addEventListener('keypress', function (event) { // Makes enter key have same properties as the button
            if (event.keyCode === 13 || event.which === 13) { // 13 is the key code of ENTER key.
                appCtrlAddItem();
            }
        });

        // Listens for click on deleting item
        document.querySelector(DOMStrings.container).addEventListener('click', appCtrlDeleteItem);
          
    }

    var appCtrlAddItem = function() {

        // 1. Get the filled input data
        var input = UICtrl.getInput(); //calling the getInput method from the UIController

        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
            // 2. Add the item to the budget controller
            var newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            // 3. Add the item to the UI controller
            UICtrl.addListItem(newItem, input.type);
            // 4. Clear the fields
            UICtrl.clearFields();    
            //5. Calculate and update budget
            updateBudget();
            //6. Calculate and update percentages
            updatePercentages();
        }
    };

    var appCtrlDeleteItem = function(event) { // Pass in event so that you can find the '.target' property of the event object i.e. what was clicked

        // Traverses the DOM and uses event bubbling to get the ID of the associated list item that has been clicked (expense or income)
        var itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        // Splits the id up into an type and an id e.g. exp-1 is an expense and an id of 1
        if (itemID) {

            var splitID = itemID.split('-');
            var type = splitID[0];
            var id = parseInt(splitID[1]);

            // Deletes item from data structure
            budgetCtrl.deleteItem(type, id);

            // Deletes item from UI
            UICtrl.deleteListItem(itemID);

            // Updates and displays new budget
            updateBudget();

            //6. Calculate and update percentages
            updatePercentages();
        }

    }

    var updateBudget = function() {
        // 1. Calculate the budget
        budgetCtrl.calculateBudget();
        // 2. Return the budget
        var budget = budgetCtrl.getBudget();
        // 3. Display the calculated budget
        UICtrl.displayBudget(budget);
    };

    updatePercentages = function () {

        // Calculate percentages
        budgetCtrl.calculatePercentages();
        // Get percentages from budget controller
        var percentages = budgetCtrl.getPercentages();
        // Update UI with new percentages
        UICtrl.displayPercentages(percentages);
    };

    return {
        init: function () {
            setupEventListeners();
            console.log('Application has started.');
            UICtrl.displayDate();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1,
            });
        }
    }

})(UIController, budgetController);

appController.init();