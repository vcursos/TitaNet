import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './screens/login';
import Home from './screens/home';
import WorkOrders from './screens/work-orders';
import CustomerDetail from './screens/customer-detail';
import Diagnostics from './screens/diagnostics';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="WorkOrders" component={WorkOrders} />
        <Stack.Screen name="CustomerDetail" component={CustomerDetail} />
        <Stack.Screen name="Diagnostics" component={Diagnostics} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;