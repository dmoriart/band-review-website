import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import './FirebaseConnectionTest.css';

const FirebaseConnectionTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebaseConnection = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      addResult('🔄 Starting Firebase connection test...');
      
      // Test 1: Check if Firebase is initialized
      if (!db) {
        addResult('❌ Firebase database not initialized');
        return;
      }
      addResult('✅ Firebase database initialized');
      
      // Test 2: Try to read from a collection (non-destructive)
      addResult('🔍 Testing read operation...');
      const testCollection = collection(db, 'bandUsers');
      const q = query(testCollection, limit(1));
      
      const readStart = Date.now();
      const snapshot = await getDocs(q);
      const readTime = Date.now() - readStart;
      
      addResult(`✅ Read operation successful in ${readTime}ms (${snapshot.size} documents)`);
      
      // Test 3: Try to write a test document
      addResult('📝 Testing write operation...');
      const testDoc = {
        test: true,
        timestamp: new Date(),
        purpose: 'connection-test'
      };
      
      const writeStart = Date.now();
      const docRef = await addDoc(collection(db, 'connectionTests'), testDoc);
      const writeTime = Date.now() - writeStart;
      
      addResult(`✅ Write operation successful in ${writeTime}ms (ID: ${docRef.id})`);
      addResult('🎉 All Firebase connection tests passed!');
      
    } catch (error: any) {
      addResult(`❌ Firebase connection test failed: ${error.message}`);
      addResult(`❌ Error code: ${error.code || 'unknown'}`);
      addResult(`❌ Error details: ${JSON.stringify(error.details || {})}`);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="firebase-test-container">
      <h3>Firebase Connection Diagnostics</h3>
      
      <div className="firebase-test-buttons">
        <button 
          onClick={testFirebaseConnection} 
          disabled={testing}
          className="firebase-test-button primary"
        >
          {testing ? 'Testing...' : 'Test Firebase Connection'}
        </button>
        <button 
          onClick={clearResults}
          disabled={testing}
          className="firebase-test-button secondary"
        >
          Clear Results
        </button>
      </div>
      
      <div className="firebase-test-results">
        {results.length === 0 && !testing && (
          <p className="firebase-test-placeholder">Click "Test Firebase Connection" to run diagnostics</p>
        )}
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`firebase-test-result ${
              result.includes('✅') ? 'success' : 
              result.includes('❌') ? 'error' : 
              'info'
            }`}
          >
            {result}
          </div>
        ))}
      </div>
      
      <div className="firebase-test-info">
        <p><strong>What this tests:</strong></p>
        <ul>
          <li>Firebase initialization</li>
          <li>Read permissions and performance</li>
          <li>Write permissions and performance</li>
          <li>Network connectivity to Firestore</li>
        </ul>
        <p><em>Check browser console (F12) for additional details</em></p>
      </div>
    </div>
  );
};

export default FirebaseConnectionTest;
