import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const DiagnosticsScreen = () => {
    const handleRunDiagnostics = () => {
        // Logic to run diagnostics
        console.log('Running diagnostics...');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Diagnostics</Text>
            <Text style={styles.description}>
                Use this screen to perform diagnostics on the network and devices.
            </Text>
            <Button title="Run Diagnostics" onPress={handleRunDiagnostics} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 16,
        marginVertical: 16,
        textAlign: 'center',
    },
});

export default DiagnosticsScreen;