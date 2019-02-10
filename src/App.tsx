import * as React from 'react';
import './App.css';
import SongDirectoryDropZone from './components/song-directory-drop-zone';

export default class App extends React.Component {
  public render() {
    return <SongDirectoryDropZone />;
  }
}
