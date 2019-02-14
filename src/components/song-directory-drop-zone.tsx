import { FileWithPath, fromEvent } from 'file-selector';
import PromiseFileReader from 'promise-file-reader';
import * as React from 'react';
import Dropzone from 'react-dropzone';
import SmaLoader from 'src/loaders/sma';
import SscLoader from 'src/loaders/ssc';

interface ISongDirectoryDropZoneState {
  files: FileWithPath[];
}

const collator = new Intl.Collator();

export default class SongDirectoryDropZone extends React.Component<
  {},
  ISongDirectoryDropZoneState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      files: []
    };
  }

  public render() {
    const files = this.state.files.map((file) => {
      const onClick = () => this.convertFile(file);
      return (
        <li key={file.path} onClick={onClick}>
          {file.path} - {file.size} bytes
        </li>
      );
    });
    return (
      <section>
        <Dropzone
          getDataTransferItems={this.getDataTransferItems}
          onDrop={this.onDrop}
        >
          {({ getRootProps }) => (
            <div className="dropzone" {...getRootProps()}>
              <p>Drop a folder with files here</p>
            </div>
          )}
        </Dropzone>
        <aside>
          <h4>Files</h4>
          <ul>{files}</ul>
        </aside>
      </section>
    );
  }

  protected convertFile = async (file: FileWithPath) => {
    const sscLoader = new SscLoader(await PromiseFileReader.readAsText(file));
    const smaLoader = new SmaLoader();
    smaLoader.importFromSsc(sscLoader);
    console.log(file.path);
    console.dir(sscLoader);
    console.dir(smaLoader);
    console.log(smaLoader.toString());
  };

  protected getDataTransferItems = async (event: Event) =>
    ((await fromEvent(event)) as FileWithPath[])
      .filter(({ name = '' }) => /\.ssc$/i.test(name))
      .sort((a, b) => collator.compare(a.name, b.name));

  protected onDrop = (files: FileWithPath[]) => this.setState({ files });
}
