# Coffee_Shop
This is a coffee shop website featuring a cart and order history saved to localStorage.
This program consists of several charts built with Chart.js.  
There are bar, line, pi, and scatter plot charts.

-----------------------------------------------------------------------------------------------------------------------------------------

Coffee.js
Handles the menu and cart system:
- The user can add coffee, change quantities, and remove 
- It displays live updates
- It has an order form where users can submit orders with custom notes 
  (like "extra sugar" or "no cream")
- When submitted, it shows a receipt message that summarizes what the user ordered
- It saves the coffee that is ordered into localStorage so that history.js can use its information

It includes two live charts:
- Calories in Current Cart shows the calories of selected coffee for each specified coffee type 
  (like espresso has 10 total calories, but a latte has 400)
- Drinks in Cart shows a pie chart of the quantity for each specific drink 
  (like blue is latte and there is 5, and then iced is yellow and it has 3)

-----------------------------------------------------------------------------------------------------------------------------------------

History.js
- History.js loads orders from localStorage with the name coffeeOrderHistory.
- It displays order history in a table
- It has an all-time drinks ordered bar chart based on saved history
- It also includes a Clear History function that wipes all saved orders from history 

-----------------------------------------------------------------------------------------------------------------------------------------

About.js
It tells the user what the program is about.
It also displays a line chart of orders throughout a typical displays
