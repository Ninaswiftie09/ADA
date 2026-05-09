import Map from './components/Map';
import DestinationInput from './components/DestinationInput';
import RouteResult from './components/RouteResult';

export default function App() {
  return (
    <>
      <DestinationInput />
      <Map />
      <RouteResult />
    </>
  );
}
