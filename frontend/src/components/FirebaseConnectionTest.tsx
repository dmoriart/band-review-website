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
      addResult('🔄 Starting comprehensive Firebase diagnostics...');
      
      // Test 1: Check if Firebase is initialized
      if (!db) {
        addResult('❌ Firebase database not initialized - check environment variables');
        return;
      }
      addResult('✅ Firebase database initialized');
      
      // Test 2: Check authentication status
      const { auth } = await import('../firebase');
      if (!auth) {
        addResult('❌ Firebase auth not initialized');
      } else if (auth.currentUser) {
        addResult(`✅ User authenticated: ${auth.currentUser.email}`);
      } else {
        addResult('⚠️ No user authenticated - this may affect Firestore permissions');
      }
      
      // Test 3: Try to read from a simple test collection first
      addResult('🔍 Testing read from connectionTests collection...');
      const testCollection = collection(db, 'connectionTests');
      const q1 = query(testCollection, limit(1));
      
      const readStart1 = Date.now();
      const snapshot1 = await getDocs(q1);
      const readTime1 = Date.now() - readStart1;
      
      addResult(`✅ connectionTests read in ${readTime1}ms (${snapshot1.size} documents)`);
      
      // Test 4: Try to read from bandUsers collection (the problematic one)
      addResult('🔍 Testing read from bandUsers collection...');
      const bandUsersCollection = collection(db, 'bandUsers');
      const q2 = query(bandUsersCollection, limit(1));
      
      const readStart2 = Date.now();
      const snapshot2 = await getDocs(q2);
      const readTime2 = Date.now() - readStart2;
      
      if (readTime2 > 10000) {
        addResult(`⚠️ bandUsers read SLOW: ${readTime2}ms (${snapshot2.size} documents) - possible rules/indexing issue`);
      } else {
        addResult(`✅ bandUsers read in ${readTime2}ms (${snapshot2.size} documents)`);
      }
      
      // Test 5: Try to write a test document to connectionTests
      addResult('📝 Testing write to connectionTests collection...');
      const testDoc = {
        test: true,
        timestamp: new Date(),
        purpose: 'comprehensive-diagnostics',
        userAgent: navigator.userAgent.substring(0, 100)
      };
      
      const writeStart = Date.now();
      const docRef = await addDoc(collection(db, 'connectionTests'), testDoc);
      const writeTime = Date.now() - writeStart;
      
      if (writeTime > 5000) {
        addResult(`⚠️ connectionTests write SLOW: ${writeTime}ms (ID: ${docRef.id})`);
      } else {
        addResult(`✅ connectionTests write in ${writeTime}ms (ID: ${docRef.id})`);
      }
      
      // Test 6: Try to write to bandUsers collection (where the actual issue happens)
      addResult('📝 Testing write to bandUsers collection...');
      const bandUserTestDoc = {
        test: true,
        userId: 'diagnostic-test',
        userEmail: 'test@example.com',
        bandId: 'test-band',
        bandName: 'Test Band',
        role: 'owner',
        status: 'pending',
        claimMethod: 'email',
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const bandUserWriteStart = Date.now();
      try {
        const bandUserDocRef = await addDoc(collection(db, 'bandUsers'), bandUserTestDoc);
        const bandUserWriteTime = Date.now() - bandUserWriteStart;
        
        if (bandUserWriteTime > 10000) {
          addResult(`⚠️ bandUsers write SLOW: ${bandUserWriteTime}ms (ID: ${bandUserDocRef.id}) - this explains the timeout!`);
        } else {
          addResult(`✅ bandUsers write in ${bandUserWriteTime}ms (ID: ${bandUserDocRef.id})`);
        }
      } catch (writeError: any) {
        const bandUserWriteTime = Date.now() - bandUserWriteStart;
        addResult(`❌ bandUsers write failed after ${bandUserWriteTime}ms: ${writeError.message}`);
        addResult(`❌ Error code: ${writeError.code || 'unknown'}`);
        if (writeError.code === 'permission-denied') {
          addResult('💡 SOLUTION: Check Firestore security rules - they may be blocking writes to bandUsers collection');
        }
      }
      
      addResult('🎉 Firebase diagnostics completed!');
      
    } catch (error: any) {
      addResult(`❌ Firebase diagnostics failed: ${error.message}`);
      addResult(`❌ Error code: ${error.code || 'unknown'}`);
      if (error.code === 'permission-denied') {
        addResult('💡 SOLUTION: Check Firestore security rules');
      } else if (error.message?.includes('timeout')) {
        addResult('💡 SOLUTION: This is a performance issue - check Firebase indexing and rules');
      }
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
