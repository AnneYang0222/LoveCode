import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CollaborationService } from '../../services/collaboration.service';
import { DataService} from '../../services/data.service';
declare const ace: any;
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  sessionId: string;
  languages: string[] = ['Java', 'Python'];
  language: string = 'Java';
  editor: any;
  defaultContent = {
   'Java': `public class Example {
     public static void main(String[] args) {
         // Type your Java code here
     }
   }`,
   'Python': `class Solution:
   def example():
       # Write your Python code here`
  };
  output: string = '';
  constructor(private collaboration: CollaborationService,
              private route: ActivatedRoute,
              private dataService: DataService) { }

  ngOnInit() {
    this.route.params
      .subscribe(params => {
        this.sessionId = params['id'];
        this.initEditor();
        this.collaboration.restoreBuffer();
      });
  }

  initEditor(): void {
    this.editor = ace.edit("editor");
    this.editor.setTheme("ace/theme/eclipse");
    this.resetEditor();
    this.editor.$blockScrolling = Infinity;

    // set up collaboration socket
    this.collaboration.init(this.editor, this.sessionId);
    this.editor.lastAppliedChange = null;

    // register change callback
    this.editor.on('change', (e) => {
      console.log('editor change: ' + JSON.stringify(e));
      if (this.editor.lastAppliedChange != e) {
        this.collaboration.change(JSON.stringify(e));
      }
    });

    this.editor.getSession().getSelection().on('changeCursor', ()=> {
      const cursor = this.editor.getSession().getSelection().getCursor();
      console.log('curser move log from client' + JSON.stringify(cursor));
      this.collaboration.cursorMove(JSON.stringify(cursor));
    });
  }

  resetEditor(): void {
    this.editor.setValue(this.defaultContent[this.language]);
    this.editor.getSession().setMode("ace/mode/" + this.language.toLowerCase());
  }

  setLanguage(language: string): void {
    this.language = language;
    this.resetEditor();
  }

  submit(): void {
    const userCodes = this.editor.getValue();
    const data = {
      userCodes: userCodes,
      lang: this.language.toLocaleLowerCase()
    };
    //console.log(userCodes);
    this.dataService.buildAndRun(data)
        .then(res => this.output = res.text);
  }

}