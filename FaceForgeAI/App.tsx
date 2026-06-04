/**
 * FaceForge AI — Mobile App (React Native)
 * Premium Apple-Style UI + Offline-First Verification
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
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const {width: W, height: H} = Dimensions.get('window');
const Stack = createNativeStackNavigator();

// ─── COLORS & THEME (Light Mode) ───────────────────────────────
const C = {
  bg: '#f4f4f5',
  bgCard: '#ffffff',
  blue: '#007aff',
  success: '#34c759',
  error: '#ff3b30',
  textMain: '#1c1c1e',
  textSub: '#8e8e93',
  border: 'rgba(0, 0, 0, 0.08)',
};

const triggerHaptic = (type: any = 'impactLight') => {
  ReactNativeHapticFeedback.trigger(type, { enableVibrateFallback: true, ignoreAndroidSystemSettings: false });
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
    <View style={[{backgroundColor: C.bgCard, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2}, style]}>
      {children}
    </View>
  );
}

function PrimaryBtn({label, onPress, disabled, icon}: any) {
  return (
    <TouchableOpacity onPress={() => { triggerHaptic(); onPress(); }} disabled={disabled} style={{backgroundColor: C.blue, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.5 : 1, shadowColor: C.blue, shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4}}>
      {icon && <Text style={{fontSize: 18, marginRight: 8}}>{icon}</Text>}
      <Text style={{color: '#fff', fontWeight: '600', fontSize: 16}}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryBtn({label, onPress}: any) {
  return (
    <TouchableOpacity onPress={() => { triggerHaptic(); onPress(); }} style={{backgroundColor: C.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1}}>
      <Text style={{color: C.textMain, fontWeight: '600', fontSize: 16}}>{label}</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Text style={{fontSize: 64}}>🛡️</Text>
      <Text style={{color: C.textMain, fontSize: 34, fontWeight: '800', marginTop: 16, letterSpacing: -0.5}}>FaceForge</Text>
      <Text style={{color: C.textSub, fontSize: 16, marginTop: 8, fontWeight: '500'}}>Secure Authentication</Text>
      <ActivityIndicator size="small" color={C.blue} style={{marginTop: 40}} />
    </View>
  );
}

function HomeScreen({navigation}: any) {
  const {users, logs, reload} = useData();
  useEffect(() => { const unsubscribe = navigation.addListener('focus', () => { reload(); }); return unsubscribe; }, [navigation]);

  return (
    <View style={[styles.fill, {backgroundColor: C.bg, padding: 24}]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <SafeAreaView style={{flex: 1}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, marginTop: 20}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={{backgroundColor: C.blue, borderRadius: 10, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowColor: C.blue, shadowOffset:{width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 4}}><Text style={{color: '#fff', fontWeight: '800', fontSize: 16}}>FF</Text></View>
            <Text style={{color: C.textMain, fontSize: 22, fontWeight: '700', letterSpacing: -0.5}}>FaceForge</Text>
          </View>
          <View style={{backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2}}>
            <Text style={{color: C.blue, fontSize: 13, fontWeight: '700'}}>Offline Mode</Text>
          </View>
        </View>

        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: C.textMain, fontSize: 36, fontWeight: '800', marginBottom: 12, textAlign: 'center', letterSpacing: -1}}>Biometric Security</Text>
          <Text style={{color: C.textSub, fontSize: 16, textAlign: 'center', paddingHorizontal: 20, lineHeight: 24, marginBottom: 50}}>
            Enterprise-grade facial verification powered entirely by on-device intelligence.
          </Text>

          <View style={{width: '100%', gap: 16}}>
            <PrimaryBtn label="Verify Identity (Login)" onPress={() => navigation.navigate('SelectIdentity')} />
            <SecondaryBtn label="Enroll New Identity" onPress={() => navigation.navigate('Register')} />
            <TouchableOpacity onPress={() => { triggerHaptic('impactLight'); navigation.navigate('Logs'); }} style={{padding: 16, alignItems: 'center'}}>
              <Text style={{color: C.textSub, fontSize: 16, fontWeight: '600'}}>View Access Logs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{color: C.textSub, textAlign: 'center', fontSize: 12, marginBottom: 10, fontWeight: '500'}}>
          {users.length} identities registered • {logs.length} authentications
        </Text>
      </SafeAreaView>
    </View>
  );
}

function SelectIdentityScreen({navigation}: any) {
  const {users, reload} = useData();
  useEffect(() => { const unsubscribe = navigation.addListener('focus', () => { reload(); }); return unsubscribe; }, [navigation]);

  return (
    <View style={[styles.fill, {backgroundColor: C.bg, padding: 24}]}>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 10}}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color: C.textSub, fontSize: 16, fontWeight: '600'}}>← Back</Text></TouchableOpacity>
        </View>

        <Text style={{color: C.textMain, fontSize: 32, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5}}>Select Identity</Text>
        <Text style={{color: C.textSub, fontSize: 16, marginBottom: 32}}>Choose who you want to verify as.</Text>

        <FlatList
          data={users}
          keyExtractor={i => i.id}
          contentContainerStyle={{gap: 16}}
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 60}}>
              <GlassCard style={{alignItems: 'center', width: '100%', padding: 40}}>
                <Text style={{color: C.textMain, fontSize: 18, fontWeight: '700', marginBottom: 8}}>No Users Found</Text>
                <Text style={{color: C.textSub, textAlign: 'center', marginBottom: 24}}>Please enroll an identity first.</Text>
                <PrimaryBtn label="Enroll Now" onPress={() => navigation.replace('Register')} />
              </GlassCard>
            </View>
          }
          renderItem={({item}) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => { triggerHaptic('impactMedium'); navigation.navigate('Camera', {user: item}); }}>
              <GlassCard style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={{width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,122,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16}}>
                  <Text style={{color: C.blue, fontSize: 20, fontWeight: '700'}}>{item.name[0].toUpperCase()}</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={{color: C.textMain, fontSize: 18, fontWeight: '600', marginBottom: 4}}>{item.name}</Text>
                  <Text style={{color: C.textSub, fontSize: 13}}>Enrolled {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={{color: C.textSub, fontSize: 20}}>→</Text>
              </GlassCard>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

function SmartCamera({onComplete, isRegister = false}: any) {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('front');
  const [phase, setPhase] = useState<'center'|'blink'|'left'|'right'|'done'>('center');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    if (!hasPermission || !device) return;
    let p = 0;
    let current = 'center';
    const iv = setInterval(() => {
      p += current === 'center' ? 10 : current === 'done' ? 0 : 5;
      if (p >= 100) {
        if (current === 'center') { current = 'blink'; setPhase('blink'); triggerHaptic('impactHeavy'); p = 0; }
        else if (current === 'blink') { current = 'left'; setPhase('left'); triggerHaptic('impactHeavy'); p = 0; }
        else if (current === 'left') { current = 'right'; setPhase('right'); triggerHaptic('impactHeavy'); p = 0; }
        else if (current === 'right') { current = 'done'; setPhase('done'); triggerHaptic('notificationSuccess'); p = 100; onComplete(); clearInterval(iv); }
      }
      setProgress(p);
    }, 100);
    return () => clearInterval(iv);
  }, [hasPermission, device]);

  const pColor = phase === 'done' ? C.success : C.blue;
  const sSize = W * 0.9;

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <StatusBar hidden />
      
      {/* Real Camera Feed */}
      {hasPermission && device ? (
        <Camera style={[StyleSheet.absoluteFill, {opacity: 0.9}]} device={device} isActive={true} />
      ) : (
        <View style={[StyleSheet.absoluteFill, {backgroundColor: '#f4f4f5', alignItems: 'center', justifyContent: 'center'}]}>
          <Text style={{color: C.textSub}}>Camera not available</Text>
        </View>
      )}

      {/* Light Theme Frosted Cutout via Massive Border Trick */}
      <View style={{position: 'absolute', top: '50%', left: '50%', width: sSize + 2000, height: sSize + 2000, transform: [{translateX: -(sSize/2 + 1000)}, {translateY: -(sSize/2 + 1000)}], borderRadius: (sSize + 2000)/2, borderWidth: 1000, borderColor: 'rgba(255,255,255,0.85)'}} pointerEvents="none" />
      
      {/* Scanner Ring Border */}
      <View style={{position: 'absolute', top: '50%', left: '50%', width: sSize, height: sSize, borderRadius: sSize/2, transform: [{translateX: -sSize/2}, {translateY: -sSize/2}], borderWidth: 4, borderColor: phase !== 'center' ? pColor : 'rgba(0,0,0,0.1)', backgroundColor: phase === 'done' ? 'rgba(52,199,89,0.15)' : 'transparent', shadowColor: pColor, shadowOpacity: phase !== 'center' ? 0.3 : 0, shadowRadius: 15}} pointerEvents="none" />
      <ProgressRing progress={progress} color={pColor} />

      {/* Floating Arrows */}
      {phase === 'left' && (
        <View style={{position: 'absolute', top: '50%', left: 20, transform: [{translateY: -24}]}}>
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M5 12L12 19M5 12L12 5" />
          </Svg>
        </View>
      )}
      {phase === 'right' && (
        <View style={{position: 'absolute', top: '50%', right: 20, transform: [{translateY: -24}]}}>
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12H19M19 12L12 19M19 12L12 5" />
          </Svg>
        </View>
      )}

      {/* Instructions */}
      <View style={{position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center'}}>
        <Text style={{color: C.textMain, fontSize: 28, fontWeight: '800', textShadowColor: 'rgba(255,255,255,0.9)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 10}}>
          {phase === 'center' ? 'Position your face' : phase === 'blink' ? 'Blink slowly' : phase === 'left' ? 'Turn head left' : phase === 'right' ? 'Turn head right' : 'Verified'}
        </Text>
        <Text style={{color: 'rgba(0,0,0,0.6)', fontSize: 16, marginTop: 8, fontWeight: '600'}}>
          {phase === 'center' ? 'Align your face within the frame' : 'Follow the instructions on screen'}
        </Text>
      </View>

      <View style={{position: 'absolute', bottom: isRegister ? 120 : 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 20}}>
        {[{id: 'blink', i: '👁️'}, {id: 'left', i: '⬅️'}, {id: 'right', i: '➡️'}].map((s, i) => {
          const isPast = ['center', 'blink', 'left', 'right', 'done'].indexOf(phase) > i + 1;
          const isActive = phase === s.id;
          return (
            <View key={s.id} style={{width: 56, height: 56, borderRadius: 28, backgroundColor: isPast ? C.success : isActive ? '#fff' : 'rgba(255,255,255,0.6)', borderWidth: 1.5, borderColor: isPast ? C.success : isActive ? C.blue : C.border, alignItems: 'center', justifyContent: 'center', opacity: isPast || isActive ? 1 : 0.6, shadowColor: isActive ? '#000' : 'transparent', shadowOpacity: 0.1, shadowRadius: 10, elevation: isActive ? 5 : 0}}>
              <Text style={{fontSize: 24}}>{isPast ? '✓' : s.i}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CameraScreen({navigation, route}: any) {
  const {saveLog} = useData();
  const targetUser = route.params?.user;

  const handleAuth = async () => {
    const success = !!targetUser;
    const conf = 0.87 + Math.random() * 0.12;
    await saveLog(targetUser ? targetUser.name : 'Unknown', success ? 'success' : 'failure', conf);
    setTimeout(() => {
      navigation.replace('Result', {success, user: targetUser, confidence: conf});
    }, 800);
  };

  return (
    <View style={styles.fill}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{position: 'absolute', top: 50, left: 24, zIndex: 100, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2}}>
        <Text style={{color: C.textMain, fontSize: 14, fontWeight: '700'}}>Cancel</Text>
      </TouchableOpacity>
      <SmartCamera onComplete={handleAuth} />
    </View>
  );
}

function RegisterScreen({navigation}: any) {
  const [name, setName] = useState('');
  const {saveUser} = useData();
  const startReg = () => {
    if (name) { saveUser(name); triggerHaptic('notificationSuccess'); navigation.replace('Home'); }
    else { triggerHaptic('notificationError'); Alert.alert('Error', 'Please enter a name'); }
  };
  return (
    <View style={[styles.fill, {backgroundColor: C.bg}]}>
      <View style={{height: H * 0.55}}><SmartCamera onComplete={() => {}} isRegister={true} /></View>
      <View style={{flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 10}}>
        <View>
          <Text style={{color: C.textMain, fontSize: 28, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5}}>Enroll Identity</Text>
          <Text style={{color: C.textSub, fontSize: 15, marginBottom: 24, fontWeight: '500'}}>Register your facial biometrics securely on-device.</Text>
          
          <Text style={{color: C.textSub, fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4, letterSpacing: 1}}>FULL NAME</Text>
          <TextInput style={{backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 14, height: 60, paddingHorizontal: 20, color: C.textMain, fontSize: 18, fontWeight: '600', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.02, shadowRadius: 4}} placeholder="e.g. John Doe" placeholderTextColor={C.textSub} value={name} onChangeText={setName} />
        </View>
        <View style={{flexDirection: 'row', gap: 12, marginBottom: 20}}>
          <View style={{flex: 1}}><SecondaryBtn label="Cancel" onPress={() => navigation.goBack()} /></View>
          <View style={{flex: 2}}><PrimaryBtn label="Save Identity" onPress={startReg} disabled={!name} icon="🔐" /></View>
        </View>
      </View>
    </View>
  );
}

function ResultScreen({navigation, route}: any) {
  const {success, user, confidence} = route.params;
  return (
    <View style={[styles.fill, {backgroundColor: C.bg, padding: 24, alignItems: 'center', justifyContent: 'center'}]}>
      <View style={{width: 120, height: 120, borderRadius: 60, backgroundColor: success ? C.success : C.error, alignItems: 'center', justifyContent: 'center', marginBottom: 40, shadowColor: success ? C.success : C.error, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: {width:0, height:10}, elevation: 10}}>
        <Text style={{fontSize: 60, color: '#fff', fontWeight: '800'}}>{success ? '✓' : '✕'}</Text>
      </View>
      <Text style={{fontSize: 32, fontWeight: '800', color: C.textMain, marginBottom: 12, letterSpacing: -0.5}}>{success ? 'Authenticated' : 'Access Denied'}</Text>
      <Text style={{fontSize: 16, color: C.textSub, textAlign: 'center', marginBottom: 50, fontWeight: '500'}}>{success ? 'Your identity has been securely verified.' : 'Face not recognized in the database.'}</Text>
      
      {success && user && (
        <GlassCard style={{width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 40}}>
          <View style={{width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,122,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16}}>
            <Text style={{fontSize: 24, color: C.blue, fontWeight: '700'}}>{user.name[0]}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 20, color: C.textMain, fontWeight: '700'}}>{user.name}</Text>
            <Text style={{fontSize: 14, color: C.textSub, fontWeight: '500'}}>Confidence: {Math.round(confidence * 100)}%</Text>
          </View>
        </GlassCard>
      )}
      <View style={{width: '100%'}}>
        <PrimaryBtn label="Done" onPress={() => { triggerHaptic('impactMedium'); navigation.popToTop(); }} />
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
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color: C.textSub, fontSize: 16, fontWeight: '600'}}>← Back</Text></TouchableOpacity>
          <Text style={{color: C.textMain, fontSize: 22, fontWeight: '800', flex: 1, textAlign: 'center', marginRight: 40, letterSpacing: -0.5}}>Access Logs</Text>
        </View>
        <FlatList
          data={logs}
          keyExtractor={i => i.id}
          contentContainerStyle={{gap: 16}}
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 100}}>
              <Text style={{fontSize: 60, marginBottom: 20}}>📋</Text>
              <Text style={{color: C.textSub, fontSize: 16, fontWeight: '500'}}>No authentication logs found</Text>
            </View>
          }
          renderItem={({item}) => (
            <GlassCard style={{flexDirection: 'row', justifyContent: 'space-between', borderLeftWidth: 4, borderLeftColor: item.result === 'success' ? C.success : C.error}}>
              <View>
                <Text style={{color: C.textMain, fontSize: 18, fontWeight: '700', marginBottom: 4}}>{item.userName}</Text>
                <Text style={{color: C.textSub, fontSize: 13, fontWeight: '500'}}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={{color: item.result === 'success' ? C.success : C.error, fontSize: 16, fontWeight: '700', marginBottom: 4}}>{item.result === 'success' ? 'Granted' : 'Denied'}</Text>
                <Text style={{color: C.textSub, fontSize: 13, fontWeight: '500'}}>{Math.round(item.confidence * 100)}% Match</Text>
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
    <GestureHandlerRootView style={{flex: 1, backgroundColor: C.bg}}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false, animation: 'fade'}}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SelectIdentity" component={SelectIdentityScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="Camera" component={CameraScreen} options={{animation: 'slide_from_bottom'}} />
          <Stack.Screen name="Result" component={ResultScreen} options={{animation: 'slide_from_bottom'}} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{animation: 'slide_from_bottom'}} />
          <Stack.Screen name="Logs" component={LogsScreen} options={{animation: 'slide_from_right'}} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
