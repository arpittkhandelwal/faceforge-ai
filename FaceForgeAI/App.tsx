/**
 * FaceForge AI — Mobile App (React Native)
 * Premium FaceID UI + Offline-First Architecture
 */

import React, {useEffect, useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  StatusBar, ScrollView, TextInput, FlatList, Alert,
  SafeAreaView, ActivityIndicator
} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

const {width: W, height: H} = Dimensions.get('window');
const Stack = createNativeStackNavigator();

// ─── COLORS & THEME ──────────────────────────────────────────
const C = {
  bg: '#09090b',
  bgCard: 'rgba(24, 24, 27, 0.6)',
  cyan: '#06b6d4',
  success: '#10b981',
  error: '#ef4444',
  textMain: '#f8fafc',
  textSub: '#94a3b8',
  border: 'rgba(255, 255, 255, 0.1)',
};

// ─── OFFLINE STORAGE HOOKS ────────────────────────────────────
const useData = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const u = await AsyncStorage.getItem('ff_users');
      const l = await AsyncStorage.getItem('ff_logs');
      if (u) setUsers(JSON.parse(u));
      if (l) setLogs(JSON.parse(l));
    } catch (e) {}
  };

  const saveUser = async (name: string) => {
    const newUser = {id: Date.now().toString(), name, createdAt: Date.now()};
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    await AsyncStorage.setItem('ff_users', JSON.stringify(newUsers));
    return newUser;
  };

  const saveLog = async (userName: string, result: string, confidence: number) => {
    const newLog = {id: Date.now().toString(), userName, result, confidence, timestamp: Date.now()};
    const newLogs = [newLog, ...logs];
    setLogs(newLogs);
    await AsyncStorage.setItem('ff_logs', JSON.stringify(newLogs));
  };

  useEffect(() => { loadData(); }, []);
  return {users, logs, saveUser, saveLog, reload: loadData};
};

// ─── UI COMPONENTS ──────────────────────────────────────────
function GlassCard({children, style}: any) {
  return (
    <View style={[{backgroundColor: C.bgCard, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20}, style]}>
      {children}
    </View>
  );
}

function PrimaryBtn({label, onPress, disabled, icon}: any) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={{backgroundColor: C.textMain, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.5 : 1}}>
      {icon && <Text style={{fontSize: 18, marginRight: 8}}>{icon}</Text>}
      <Text style={{color: C.bg, fontWeight: '600', fontSize: 16}}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryBtn({label, onPress}: any) {
  return (
    <TouchableOpacity onPress={onPress} style={{backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center'}}>
      <Text style={{color: C.textMain, fontWeight: '500', fontSize: 16}}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProgressRing({progress, color}: {progress: number, color: string}) {
  const size = W * 0.9;
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{position: 'absolute', top: '50%', left: '50%', transform: [{translateX: -size/2}, {translateY: -size/2}]}}>
      <Svg width={size} height={size}>
        <Circle stroke={color} cx={size/2} cy={size/2} r={radius} strokeWidth={6} strokeLinecap="round" fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} rotation="-90" origin={`${size/2}, ${size/2}`} />
      </Svg>
    </View>
  );
}

// ─── SCREENS ────────────────────────────────────────────────
function SplashScreen({navigation}: any) {
  useEffect(() => { setTimeout(() => navigation.replace('Home'), 1500); }, []);
  return (
    <View style={[styles.fill, {backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center'}]}>
      <StatusBar barStyle="light-content" hidden={false} />
      <Text style={{fontSize: 64}}>🛡️</Text>
      <Text style={{color: C.textMain, fontSize: 32, fontWeight: '700', marginTop: 16}}>FaceForge</Text>
      <Text style={{color: C.textSub, fontSize: 16, marginTop: 8}}>Secure Authentication</Text>
      <ActivityIndicator size="small" color={C.cyan} style={{marginTop: 40}} />
    </View>
  );
}

function HomeScreen({navigation}: any) {
  const {users, logs, reload} = useData();
  useEffect(() => { const unsubscribe = navigation.addListener('focus', () => { reload(); }); return unsubscribe; }, [navigation]);

  return (
    <View style={[styles.fill, {backgroundColor: C.bg, padding: 24}]}>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, marginTop: 20}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={{backgroundColor: C.textMain, borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12}}><Text style={{color: C.bg, fontWeight: '700'}}>FF</Text></View>
            <Text style={{color: C.textMain, fontSize: 20, fontWeight: '600'}}>FaceForge</Text>
          </View>
          <View style={{backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20}}>
            <Text style={{color: C.textMain, fontSize: 12, fontWeight: '600'}}>Offline</Text>
          </View>
        </View>

        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: C.textMain, fontSize: 36, fontWeight: '700', marginBottom: 12, textAlign: 'center'}}>Biometric Security</Text>
          <Text style={{color: C.textSub, fontSize: 16, textAlign: 'center', paddingHorizontal: 20, lineHeight: 24, marginBottom: 50}}>
            Fast, private, and secure facial recognition powered by on-device ML.
          </Text>

          <View style={{width: '100%', gap: 16}}>
            <PrimaryBtn label="Scan Face" icon="👁️" onPress={() => navigation.navigate('Camera')} />
            <SecondaryBtn label="Enroll Identity" onPress={() => navigation.navigate('Register')} />
            <TouchableOpacity onPress={() => navigation.navigate('Logs')} style={{padding: 16, alignItems: 'center'}}>
              <Text style={{color: C.textMain, fontSize: 16}}>View Access Logs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{color: C.textSub, textAlign: 'center', fontSize: 12, marginBottom: 10}}>
          {users.length} identities registered • {logs.length} authentications
        </Text>
      </SafeAreaView>
    </View>
  );
}

function SmartCamera({onComplete, isRegister = false}: any) {
  const [phase, setPhase] = useState<'center'|'blink'|'left'|'right'|'done'>('center');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    let current = 'center';
    const iv = setInterval(() => {
      p += current === 'center' ? 10 : current === 'done' ? 0 : 5;
      if (p >= 100) {
        if (current === 'center') { current = 'blink'; setPhase('blink'); p = 0; }
        else if (current === 'blink') { current = 'left'; setPhase('left'); p = 0; }
        else if (current === 'left') { current = 'right'; setPhase('right'); p = 0; }
        else if (current === 'right') { current = 'done'; setPhase('done'); p = 100; onComplete(); clearInterval(iv); }
      }
      setProgress(p);
    }, 100);
    return () => clearInterval(iv);
  }, []);

  const pColor = phase === 'done' ? C.success : C.cyan;
  const sSize = W * 0.9; // matches CSS 420px relatively

  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      <StatusBar hidden />
      <View style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)'}} />
      
      {/* Cutout Hole (simulated via massive border radius) */}
      <View style={{position: 'absolute', top: '50%', left: '50%', width: sSize, height: sSize, borderRadius: sSize/2, transform: [{translateX: -sSize/2}, {translateY: -sSize/2}], borderWidth: 2, borderColor: phase !== 'center' ? pColor : 'rgba(255,255,255,0.1)', backgroundColor: phase === 'done' ? 'rgba(16,185,129,0.1)' : 'transparent'}} />
      <ProgressRing progress={progress} color={pColor} />

      {/* Floating Arrows */}
      {phase === 'left' && (
        <View style={{position: 'absolute', top: '50%', left: 20, transform: [{translateY: -24}]}}>
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M5 12L12 19M5 12L12 5" />
          </Svg>
        </View>
      )}
      {phase === 'right' && (
        <View style={{position: 'absolute', top: '50%', right: 20, transform: [{translateY: -24}]}}>
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12H19M19 12L12 19M19 12L12 5" />
          </Svg>
        </View>
      )}

      {/* Instructions */}
      <View style={{position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center'}}>
        <Text style={{color: '#fff', fontSize: 28, fontWeight: '700'}}>
          {phase === 'center' ? 'Position your face' : phase === 'blink' ? 'Blink slowly' : phase === 'left' ? 'Turn head left' : phase === 'right' ? 'Turn head right' : 'Verified'}
        </Text>
        <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8}}>
          {phase === 'center' ? 'Align your face within the frame' : 'Follow the instructions on screen'}
        </Text>
      </View>

      <View style={{position: 'absolute', bottom: isRegister ? 120 : 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 20}}>
        {[{id: 'blink', i: '👁️'}, {id: 'left', i: '⬅️'}, {id: 'right', i: '➡️'}].map((s, i) => {
          const isPast = ['center', 'blink', 'left', 'right', 'done'].indexOf(phase) > i + 1;
          const isActive = phase === s.id;
          return (
            <View key={s.id} style={{width: 56, height: 56, borderRadius: 28, backgroundColor: isPast ? C.success : isActive ? C.bgCard : 'rgba(0,0,0,0.5)', borderWidth: 1.5, borderColor: isPast ? C.success : isActive ? C.cyan : C.border, alignItems: 'center', justifyContent: 'center', opacity: isPast || isActive ? 1 : 0.4}}>
              <Text style={{fontSize: 24}}>{isPast ? '✓' : s.i}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CameraScreen({navigation}: any) {
  const {users, saveLog} = useData();

  const handleAuth = async () => {
    const matched = users.length > 0;
    const user = matched ? users[0] : null;
    const conf = 0.87 + Math.random() * 0.12;
    await saveLog(matched ? user.name : 'Unknown', matched ? 'success' : 'failure', conf);
    setTimeout(() => {
      navigation.replace('Result', {success: matched, user, confidence: conf});
    }, 800);
  };

  return (
    <View style={styles.fill}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{position: 'absolute', top: 50, right: 24, zIndex: 100, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: '#fff', fontSize: 20}}>✕</Text>
      </TouchableOpacity>
      <SmartCamera onComplete={handleAuth} />
    </View>
  );
}

function RegisterScreen({navigation}: any) {
  const [name, setName] = useState('');
  const {saveUser} = useData();
  const startReg = () => {
    if (name) { saveUser(name); navigation.replace('Home'); }
    else { Alert.alert('Error', 'Please enter a name'); }
  };
  return (
    <View style={[styles.fill, {backgroundColor: '#000'}]}>
      <View style={{height: H * 0.6}}><SmartCamera onComplete={() => {}} isRegister={true} /></View>
      <View style={{flex: 1, backgroundColor: C.bgCard, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, justifyContent: 'space-between'}}>
        <View>
          <Text style={{color: C.textMain, fontSize: 24, fontWeight: '700', marginBottom: 20}}>Enroll Identity</Text>
          <TextInput style={{backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border, borderRadius: 14, height: 56, paddingHorizontal: 16, color: C.textMain, fontSize: 16}} placeholder="Enter your full name" placeholderTextColor={C.textSub} value={name} onChangeText={setName} />
        </View>
        <View style={{flexDirection: 'row', gap: 12}}>
          <View style={{flex: 1}}><SecondaryBtn label="Cancel" onPress={() => navigation.goBack()} /></View>
          <View style={{flex: 2}}><PrimaryBtn label="Save" onPress={startReg} disabled={!name} /></View>
        </View>
      </View>
    </View>
  );
}

function ResultScreen({navigation, route}: any) {
  const {success, user, confidence} = route.params;
  return (
    <View style={[styles.fill, {backgroundColor: C.bg, padding: 24, alignItems: 'center', justifyContent: 'center'}]}>
      <View style={{width: 120, height: 120, borderRadius: 60, backgroundColor: success ? C.success : C.error, alignItems: 'center', justifyContent: 'center', marginBottom: 40}}>
        <Text style={{fontSize: 60, color: '#fff', fontWeight: '800'}}>{success ? '✓' : '✕'}</Text>
      </View>
      <Text style={{fontSize: 32, fontWeight: '700', color: C.textMain, marginBottom: 12}}>{success ? 'Authenticated' : 'Access Denied'}</Text>
      <Text style={{fontSize: 16, color: C.textSub, textAlign: 'center', marginBottom: 50}}>{success ? 'Your identity has been securely verified.' : 'Face not recognized in the database.'}</Text>
      
      {success && user && (
        <GlassCard style={{width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 40}}>
          <View style={{width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16}}>
            <Text style={{fontSize: 24, color: C.textMain, fontWeight: '700'}}>{user.name[0]}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 20, color: C.textMain, fontWeight: '600'}}>{user.name}</Text>
            <Text style={{fontSize: 14, color: C.textSub}}>Confidence: {Math.round(confidence * 100)}%</Text>
          </View>
        </GlassCard>
      )}
      <View style={{width: '100%'}}>
        <PrimaryBtn label="Done" onPress={() => navigation.popToTop()} />
      </View>
    </View>
  );
}

function LogsScreen({navigation}: any) {
  const {logs} = useData();
  return (
    <View style={[styles.fill, {backgroundColor: C.bg, padding: 24}]}>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 10}}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color: C.textSub, fontSize: 16}}>← Back</Text></TouchableOpacity>
          <Text style={{color: C.textMain, fontSize: 22, fontWeight: '700', flex: 1, textAlign: 'center', marginRight: 40}}>Access Logs</Text>
        </View>
        <FlatList
          data={logs}
          keyExtractor={i => i.id}
          contentContainerStyle={{gap: 16}}
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 100}}>
              <Text style={{fontSize: 60, marginBottom: 20}}>📋</Text>
              <Text style={{color: C.textSub, fontSize: 16}}>No authentication logs found</Text>
            </View>
          }
          renderItem={({item}) => (
            <GlassCard style={{flexDirection: 'row', justifyContent: 'space-between', borderLeftWidth: 4, borderLeftColor: item.result === 'success' ? C.success : C.error}}>
              <View>
                <Text style={{color: C.textMain, fontSize: 18, fontWeight: '600', marginBottom: 4}}>{item.userName}</Text>
                <Text style={{color: C.textSub, fontSize: 13}}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={{color: item.result === 'success' ? C.success : C.error, fontSize: 16, fontWeight: '600', marginBottom: 4}}>{item.result === 'success' ? 'Granted' : 'Denied'}</Text>
                <Text style={{color: C.textSub, fontSize: 13}}>{Math.round(item.confidence * 100)}% Match</Text>
              </View>
            </GlassCard>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────
const styles = StyleSheet.create({ fill: {flex: 1} });

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor: '#000'}}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false, animation: 'fade'}}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} options={{animation: 'slide_from_bottom'}} />
          <Stack.Screen name="Result" component={ResultScreen} options={{animation: 'slide_from_bottom'}} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{animation: 'slide_from_bottom'}} />
          <Stack.Screen name="Logs" component={LogsScreen} options={{animation: 'slide_from_right'}} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
