import {ChangeDetectorRef, Component, NgZone, OnInit} from '@angular/core';
import {AppService} from './app.service';

// TypeScript declaration for annyang
declare var annyang: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'dialogflow-ui';
  listening = false;
  text = '';
  response: any = {};
  get textValue() {
    return this.text;
  }

  set textValue(text) {
    this.text = text;
  }

  constructor(private ngZone: NgZone, private appService: AppService) { }
  ngOnInit(): void {
    annyang.addCallback('errorNetwork', (err) => {
      this._handleError('network', 'A network error occurred.', err);
    });
    annyang.addCallback('errorPermissionBlocked', (err) => {
      this._handleError('blocked', 'Browser blocked microphone permissions.', err);
    });
    annyang.addCallback('errorPermissionDenied', (err) => {
      this._handleError('denied', 'User denied microphone permissions.', err);
    });
    annyang.addCallback('result', (phrases) => {
      console.log('I think the user said: ', phrases[0]);
      this.ngZone.run( () => {
        this.textValue = phrases[0];
        this.fetchDialogFlowText(phrases[0]);
        this.abort();
      });
      // setTimeout(() => this.textValue = phrases[0]);
      // this.cd.markForCheck();
      // console.log(this.text);
      // this.abort();
      // console.log('But then again, it could be any of the following: ', phrases);
    });
  }
  public speechSupported(): boolean {
    return !!annyang;
  }
  private _handleError(error, msg, errObj) {
    console.log(error, msg, errObj);
  }
  startListening() {
    annyang.start();
    this.listening = true;
  }
  abort() {
    annyang.abort();
    this.listening = false;
  }

  private fetchDialogFlowText(query: string) {
    this.appService.dialogFlowApiText(query)
      .subscribe((response: any) => {
        this.response.response = response.response;
        this.response.audio = response.audioFile;
        this.playByteArray(response.audioFile.data);
      });
  }

  playByteArray(byteArray) {
    const arrayBuffer = new ArrayBuffer(byteArray.length);
    const bufferView = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteArray.length; i++) {
      bufferView[i] = byteArray[i];
    }
    const context1 = new AudioContext();
    context1.decodeAudioData(
      arrayBuffer,
      buffer => {
        // Create a source node from the buffer
        const context = new AudioContext();
        const source = context.createBufferSource();
        source.buffer = buffer;
        // Connect to the final output node (the speakers)
        source.connect(context.destination);
        // Play immediately
        source.start(0);
      }
    );
  }
}
