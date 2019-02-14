import { FileWithPath, fromEvent } from 'file-selector';
import * as JSZip from 'jszip';
import PromiseFileReader from 'promise-file-reader';
import * as React from 'react';
import Dropzone from 'react-dropzone';
import SmaLoader from 'src/loaders/sma';
import SscLoader from 'src/loaders/ssc';
import { download } from '../util/common';
import './song-directory-drop-zone.css';

interface ISongDirectoryDropZoneState {
  conversionLog: string[];
}

const collator = new Intl.Collator();

export default class SongDirectoryDropZone extends React.Component<
  {},
  ISongDirectoryDropZoneState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      conversionLog: []
    };
  }

  public render() {
    return (
      <Dropzone
        getDataTransferItems={this.getDataTransferItems}
        onDrop={this.onDrop}
      >
        {({ getRootProps }) => (
          <div className="dropzone" {...getRootProps()}>
            {this.state.conversionLog.length === 0 ? (
              <h3>
                Drop a .SSC file or a folder with multiple .SSC files here...
              </h3>
            ) : (
              this.state.conversionLog.map((log, i) => <p key={i}>{log}</p>)
            )}
          </div>
        )}
      </Dropzone>
    );
  }

  protected convertFile = async (file: FileWithPath) => {
    this.setState({
      conversionLog: [...this.state.conversionLog, `Converting ${file.path}...`]
    });
    try {
      const sscLoader = new SscLoader(await PromiseFileReader.readAsText(file));
      const smaLoader = SmaLoader.importFromSsc(sscLoader);
      const convertedFile = smaLoader.toString();
      const { conversionLog } = this.state;
      conversionLog.pop();
      this.setState({
        conversionLog: [...conversionLog]
      });
      return convertedFile;
    } catch (e) {
      const { conversionLog } = this.state;
      conversionLog.pop();
      this.setState({
        conversionLog: [...conversionLog, `ERROR converting ${file.path}`]
      });
      return null;
    }
  };

  protected getDataTransferItems = async (event: Event) =>
    ((await fromEvent(event)) as FileWithPath[])
      .filter(({ name = '' }) => /\.ssc$/i.test(name))
      .sort((a, b) => collator.compare(a.name, b.name));

  protected onDrop = async (files: FileWithPath[]) => {
    switch (files.length) {
      case 0:
        return;

      case 1: {
        const path = (files[0].path || 'steps.ssc')
          .replace(/\\/g, '/')
          .replace(/\.ssc$/i, '.sma');
        const filename = path.substring(path.lastIndexOf('/') + 1);
        const convertedFile = await this.convertFile(files[0]);
        if (convertedFile != null) {
          download(filename, convertedFile);
        }
        return;
      }

      default: {
        const zip = new JSZip();
        let [, rootFolder = ''] = (files[0].path || '').match(/^(\/*[^\/]+)/);
        const useRootFolder = files.every(({ path = '' }) =>
          path.startsWith(rootFolder)
        );
        if (!useRootFolder) {
          rootFolder = 'steps';
        }
        rootFolder = rootFolder.replace(/^\/*/, '');
        for await (const file of files) {
          const path = (file.path || 'steps.ssc')
            .replace(/^\/+/, '')
            .replace(/\\/g, '/')
            .replace(/\.ssc$/i, '.sma');
          const content = await this.convertFile(file);
          if (content != null) {
            zip.file(path, content);
          }
        }
        const zipContent = await zip.generateAsync({ type: 'blob' });
        download(`${rootFolder}.zip`, zipContent, 'application/zip');
      }
    }
  };
}
