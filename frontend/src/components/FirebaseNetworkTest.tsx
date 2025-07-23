import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import './FirebaseNetworkTest.css';

const FirebaseNetworkTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [networkEnabled, setNetworkEnabled] = useState(true);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Check initial network status
    addResult('🔍 Checking initial network status...');
    addResult(`📡 Navigator online: ${navigator.onLine}`);
    addResult(`🌐 Connection type: ${(navigator as any).connection?.effectiveType || 'unknown'}`);
  }, []);

  const testNetworkConnectivity = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      addResult('🔄 Starting comprehensive network diagnostics...');
      
      // Test 1: Basic network connectivity
      addResult('🌐 Testing basic internet connectivity...');
      try {
        const response = await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        addResult('✅ Basic internet connectivity: OK');
      } catch (error) {
        addResult('❌ Basic internet connectivity: FAILED');
        addResult('💡 ISSUE: No internet connection detected');
      }

      // Test 2: Firebase/Google connectivity
      addResult('🔥 Testing Firebase connectivity...');
      try {
        const response = await fetch('https://firebase.googleapis.com/', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        addResult('✅ Firebase endpoints reachable');
      } catch (error) {
        addResult('❌ Firebase endpoints unreachable');
        addResult('💡 ISSUE: Firebase services may be blocked');
      }

      // Test 3: Firestore specific connectivity
      addResult('🗄️ Testing Firestore connectivity...');
      try {
        const response = await fetch('https://firestore.googleapis.com/', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        addResult('✅ Firestore endpoints reachable');
      } catch (error) {
        addResult('❌ Firestore endpoints unreachable');
        addResult('💡 ISSUE: Firestore may be blocked by firewall/proxy');
      }

      // Test 4: Firebase network state
      if (!db) {
        addResult('❌ Firebase database not initialized');
        return;
      }

      addResult('🔌 Testing Firebase network state...');
      
      // Try to force enable network
      try {
        await enableNetwork(db);
        addResult('✅ Firebase network enabled successfully');
        setNetworkEnabled(true);
      } catch (error: any) {
        addResult(`❌ Failed to enable Firebase network: ${error.message}`);
      }

      // Test 5: Check if client is actually offline
      addResult('📱 Checking Firebase client status...');
      
      // Create a simple test to see if Firebase thinks it's online
      const { onSnapshot, collection, query, limit } = await import('firebase/firestore');
      
      let isOnline = false;
      const unsubscribe = onSnapshot(
        query(collection(db, 'connectionTests'), limit(1)),
        (snapshot) => {
          isOnline = true;
          addResult('✅ Firebase client is ONLINE - receiving real-time updates');
          unsubscribe();
        },
        (error) => {
          addResult(`❌ Firebase client appears OFFLINE: ${error.message}`);
          if (error.code === 'unavailable') {
            addResult('💡 SOLUTION: Firebase is in offline mode - check network settings');
          }
          unsubscribe();
        }
      );

      // Wait a bit to see if we get a response
      setTimeout(() => {
        if (!isOnline) {
          addResult('⚠️ No real-time response received - client may be in offline mode');
        }
      }, 5000);

      addResult('🎉 Network diagnostics completed!');
      
    } catch (error: any) {
      addResult(`❌ Network test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const forceOnlineMode = async () => {
    if (!db) {
      addResult('❌ Firebase database not initialized');
      return;
    }

    try {
      addResult('🔄 Forcing Firebase online mode...');
      await enableNetwork(db);
      addResult('✅ Firebase network enabled - client should now be online');
      setNetworkEnabled(true);
    } catch (error: any) {
      addResult(`❌ Failed to enable network: ${error.message}`);
    }
  };

  const forceOfflineMode = async () => {
    if (!db) {
      addResult('❌ Firebase database not initialized');
      return;
    }

    try {
      addResult('🔄 Forcing Firebase offline mode...');
      await disableNetwork(db);
      addResult('⚠️ Firebase network disabled - client is now offline');
      setNetworkEnabled(false);
    } catch (error: any) {
      addResult(`❌ Failed to disable network: ${error.message}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="firebase-network-test-container">
      <h3>Firebase Network Diagnostics</h3>
      
      <div className="firebase-network-status">
        <div className={`network-status ${networkEnabled ? 'online' : 'offline'}`}>
          Firebase Status: {networkEnabled ? '🟢 Online' : '🔴 Offline'}
        </div>
        <div className="browser-status">
          Browser Status: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>
      
      <div className="firebase-network-test-buttons">
        <button 
          onClick={testNetworkConnectivity} 
          disabled={testing}
          className="firebase-network-test-button primary"
        >
          {testing ? 'Testing...' : 'Test Network Connectivity'}
        </button>
        <button 
          onClick={forceOnlineMode}
          disabled={testing}
          className="firebase-network-test-button success"
        >
          Force Online Mode
        </button>
        <button 
          onClick={forceOfflineMode}
          disabled={testing}
          className="firebase-network-test-button warning"
        >
          Force Offline Mode
        </button>
        <button 
          onClick={clearResults}
          disabled={testing}
          className="firebase-network-test-button secondary"
        >
          Clear Results
        </button>
      </div>
      
      <div className="firebase-network-test-results">
        {results.length === 0 && !testing && (
          <p className="firebase-network-test-placeholder">Click "Test Network Connectivity" to diagnose offline issues</p>
        )}
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`firebase-network-test-result ${
              result.includes('✅') ? 'success' : 
              result.includes('❌') ? 'error' : 
              result.includes('💡') ? 'solution' :
              result.includes('⚠️') ? 'warning' :
              'info'
            }`}
          >
            {result}
          </div>
        ))}
      </div>
      
      <div className="firebase-network-test-info">
        <p><strong>Common "client is offline" solutions:</strong></p>
        <ul>
          <li>Click "Force Online Mode" to re-enable Firebase network</li>
          <li>Check if your firewall is blocking Firebase/Google services</li>
          <li>Verify your internet connection is stable</li>
          <li>Try refreshing the page to reset Firebase state</li>
          <li>Check browser console for additional network errors</li>
        </ul>
        <p><em>The "client is offline" error is usually a network configuration issue</em></p>
      </div>
    </div>
  );
};

export default FirebaseNetworkTest;
