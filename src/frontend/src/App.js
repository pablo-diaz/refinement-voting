import CreateRoom from './pages/CreateRoomPage'
import JoinRoom from './pages/JoinRoomPage'

import './App.css';

function App() {
  const queryParams = new URLSearchParams(window.location.search);

  return (
    <>
    {
      queryParams.size === 0 && <CreateRoom />
    }
    {
      queryParams.has("r") && <JoinRoom contextData={{ roomId: queryParams.get("r") }} />
    }
    </>
  );
}

export default App;
