import { FileWithPath, fromEvent } from 'file-selector';
import * as React from 'react';
import Dropzone from 'react-dropzone';

interface ISongDirectoryDropZoneState {
  files: FileWithPath[];
}

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
    const files = this.state.files.map((f: FileWithPath) => (
      <li key={f.name}>
        {f.path} - {f.size} bytes
      </li>
    ));
    return (
      <section>
        <div>
          <Dropzone
            getDataTransferItems={this.getDataTransferItems}
            onDrop={this.onDrop}
          >
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drop a folder with files here</p>
              </div>
            )}
          </Dropzone>
        </div>
        <aside>
          <h4>Files</h4>
          <ul>{files}</ul>
        </aside>
      </section>
    );
  }

  protected getDataTransferItems = (event: Event) => {
    return fromEvent(event);
  };

  protected onDrop = (files: FileWithPath[]) => this.setState({ files });
}
