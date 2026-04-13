import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CustomerDetail = ({ route }) => {
    const { customer } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Customer Details</Text>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{customer.name}</Text>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{customer.email}</Text>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{customer.phone}</Text>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{customer.address}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        marginBottom: 10,
    },
});

export default CustomerDetail;