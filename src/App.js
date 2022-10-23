import logo from './logo.svg';
import './App.css';
import MapView from './mapview.js'

function App() {
  return (
    <div id="App">
      <AppHeader />
      <AppBody />
      <AppFooter />
    </div>
  );
}

function AppHeader() {
  return (
    <header id="App-header">
        <h1>OpenRoutes</h1>
        <p>An open tool for viewing and filtering GPS routes.</p>
      </header>
  );
}

function AppFooter() {
  return (
    <footer id="App-footer">
        <p>&copy; 2022 Tyler Jaszkowiak</p>
      </footer>
  );
}

function AppBody() {
  return (
    <div id="App-body">
      <MapView />
    </div>
  );
}

export default App;
