import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './FirestoreRulesTest.css';

const FirestoreRulesTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirestoreRules = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      addResult('🔄 Testing Firestore security rules...');
      
      if (!db) {
        addResult('❌ Firebase database not initialized');
        return;
      }

      // Test 1: Try to read a specific document
      addResult('📖 Testing document read permissions...');
      try {
        const testDocRef = doc(db, 'bandUsers', 'test-doc-that-probably-doesnt-exist');
        const docSnap = await getDoc(testDocRef);
        
        if (docSnap.exists()) {
          addResult('✅ Document read successful - document exists');
        } else {
          addResult('✅ Document read successful - document does not exist (this is expected)');
        }
      } catch (readError: any) {
        addResult(`❌ Document read failed: ${readError.message}`);
        if (readError.code === 'permission-denied') {
          addResult('💡 ISSUE: Firestore rules are blocking reads to bandUsers collection');
          addResult('💡 FIX: Update Firestore rules to allow authenticated users to read bandUsers');
        }
      }

      // Test 2: Try to write a document
      addResult('📝 Testing document write permissions...');
      try {
        const testDocRef = doc(db, 'bandUsers', `rules-test-${Date.now()}`);
        await setDoc(testDocRef, {
          test: true,
          createdAt: new Date(),
          purpose: 'rules-testing'
        });
        addResult('✅ Document write successful');
      } catch (writeError: any) {
        addResult(`❌ Document write failed: ${writeError.message}`);
        if (writeError.code === 'permission-denied') {
          addResult('🚨 ISSUE FOUND: Firestore rules are blocking writes to bandUsers collection');
          addResult('💡 FIX: Update Firestore rules to allow authenticated users to write to bandUsers');
          addResult('💡 Example rule: allow read, write: if request.auth != null;');
        } else if (writeError.code === 'unavailable') {
          addResult('💡 ISSUE: Firebase service temporarily unavailable');
        }
      }

      // Test 3: Check authentication status
      const { auth } = await import('../firebase');
      if (!auth?.currentUser) {
        addResult('⚠️ User not authenticated - this could be causing permission issues');
        addResult('💡 TIP: Make sure users are logged in before trying to claim bands');
      } else {
        addResult(`✅ User authenticated: ${auth.currentUser.email}`);
        addResult(`✅ User ID: ${auth.currentUser.uid}`);
      }

      addResult('🎉 Firestore rules test completed!');
      
    } catch (error: any) {
      addResult(`❌ Rules test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const generateSuggestedRules = () => {
    addResult('📋 SUGGESTED FIRESTORE RULES:');
    addResult('');
    addResult('rules_version = "2";');
    addResult('service cloud.firestore {');
    addResult('  match /databases/{database}/documents {');
    addResult('    // Allow authenticated users to read/write bandUsers');
    addResult('    match /bandUsers/{document} {');
    addResult('      allow read, write: if request.auth != null;');
    addResult('    }');
    addResult('    // Allow anyone to read/write connectionTests (for debugging)');
    addResult('    match /connectionTests/{document} {');
    addResult('      allow read, write: if true;');
    addResult('    }');
    addResult('  }');
    addResult('}');
    addResult('');
    addResult('💡 Copy these rules to your Firestore console');
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="firestore-rules-test-container">
      <h3>Firestore Rules Diagnostics</h3>
      
      <div className="firestore-rules-test-buttons">
        <button 
          onClick={testFirestoreRules} 
          disabled={testing}
          className="firestore-rules-test-button primary"
        >
          {testing ? 'Testing...' : 'Test Firestore Rules'}
        </button>
        <button 
          onClick={generateSuggestedRules}
          disabled={testing}
          className="firestore-rules-test-button secondary"
        >
          Show Suggested Rules
        </button>
        <button 
          onClick={clearResults}
          disabled={testing}
          className="firestore-rules-test-button secondary"
        >
          Clear Results
        </button>
      </div>
      
      <div className="firestore-rules-test-results">
        {results.length === 0 && !testing && (
          <p className="firestore-rules-test-placeholder">Click "Test Firestore Rules" to check permissions</p>
        )}
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`firestore-rules-test-result ${
              result.includes('✅') ? 'success' : 
              result.includes('❌') || result.includes('🚨') ? 'error' : 
              result.includes('💡') ? 'solution' :
              result.includes('rules_version') ? 'code' :
              'info'
            }`}
          >
            {result}
          </div>
        ))}
      </div>
      
      <div className="firestore-rules-test-info">
        <p><strong>This test checks:</strong></p>
        <ul>
          <li>Read permissions on bandUsers collection</li>
          <li>Write permissions on bandUsers collection</li>
          <li>User authentication status</li>
          <li>Provides suggested Firestore rules</li>
        </ul>
        <p><em>If writes are failing, the issue is likely Firestore security rules</em></p>
      </div>
    </div>
  );
};

export default FirestoreRulesTest;
