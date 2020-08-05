import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireDatabase } from '@angular/fire/database';
import { trigger, style, animate, transition, keyframes, state } from '@angular/animations';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { map } from 'rxjs/operators';

export interface DataUser {
  username: string;
  highscore: number;
  userId: string;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger(
      'deckAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('100ms', style({ transform: 'translateX(100%)', opacity: 1 })),
        animate('100ms', style({ transform: 'translateX(-100%)', opacity: 1 })),
        animate('100ms', style({ transform: 'translateX(100%)', opacity: 1 })),
        animate('100ms', style({ transform: 'translateX(0)', opacity: 0 })),
      ])
    ])
  ]
})

export class AppComponent implements OnInit {
  title = 'FLIP IT';
  items;
  itemClicked;
  columns = 2;
  rows = 2;
  showModal = true;
  content = '';
  buttonText = 'Start';
  name = '';
  failureCount = 10;
  lastHighScore = 0;
  userId: any;
  showTopScores = false;
  showCat = true;
  cards = ['assets/ghost.svg',
    'assets/angry.svg',
    'assets/cat.svg',
    'assets/cowboy.svg',
    'assets/lol.svg',
    'assets/hiss.svg',
    'assets/monkey.svg',
    'assets/love.svg',
    'assets/wink.svg',
    'assets/rollingEyes.svg',
    'assets/cry.svg',
    'assets/kiss.svg'
  ];
  points = 0;
  openCount = 0;
  // topScores: { username: string; highscore: number; userId: string; id: string; }[] = [];
  clickedIndex: any;
  topScores: { username: string; highscore: number; userId: string; id: any; }[];
  constructor(private appTitle: Title,
    private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer,
    private firestore: AngularFirestore,
    private db: AngularFireDatabase
  ) {
    this.appTitle.setTitle('FLIP IT!');
  }


  ngOnInit(): void {
    this.generateSVGs(Array.from(Array(this.cards.length), (_, i) => i + 1));
    this.deckGenerator();
  }


  generateSVGs(items: number[]): void {
    items.forEach((item, index) => {
      this.matIconRegistry.addSvgIcon(
        'img' + (index + 1),
        this.domSanitizer.bypassSecurityTrustResourceUrl(this.cards[index]));
    });
  }

  showAll(): void {
    this.items.map(item => item.show = true);
  }

  hideAll(): void {
    setTimeout(() => {
      this.items.map(item => item.show = false);
    }, 1000);
  }

  deckGenerator(): void {
    const deckArray = Array.from(Array((this.rows * this.columns) / 2), (_, i) => i + 1);
    const repeat = (a, n) => n ? a.concat(repeat(a, --n)) : [];
    this.items = this.shuffle(repeat(deckArray, 2)).map(item => ({ show: true, value: item }));
    this.hideAll();
  }

  shuffle(array): number[] {
    return array.sort(() => Math.random() - 0.5);
  }


  checkClick(event, item, index): void {
    if (item.show === false && event.isTrusted) {
      if (!this.itemClicked) {
        // firstTime
        this.items[index].show = true;
        this.clickedIndex = index;
        this.itemClicked = this.items[index].value;
      } else {
        // second time
        if (item.value === this.itemClicked) {
          // checking if the new item = previously clicked item
          if (index !== this.clickedIndex) {
            this.items[index].show = true;
            delete this.itemClicked;
            this.points++;
            this.openCount++;
            this.checkCompletionandRedeck();
          }
        } else {
          console.log('Not the same item');
          // the second item is not previously clicked item, so hide both;
          this.items[index].show = true;
          setTimeout(() => {
            this.items[this.clickedIndex].show = false;
            this.items[index].show = false;
            if (this.failureCount <= 0) {
              this.show();
            } else {
              this.failureCount--;
            }
            delete this.itemClicked;
          }, 100);
        }
      }
    }
  }

  checkCompletionandRedeck() {
    if (this.items.every((item) => item.show === true)) {
      this.hideAll();
      delete this.clickedIndex;
      delete this.itemClicked;
      this.openCount = 0;
      this.deckGeneratorDelayed();
    }
  }

  deckGeneratorDelayed(): void {
    setTimeout(() => {
      if (this.points >= 100) {
        this.columns = 4;
        this.rows = 7;
      }
      if (this.points >= 90) {
        this.columns = 4;
        this.rows = 5;
      }
      else if (this.points >= 60) {
        this.columns = 4;
        this.rows = 4;
      }
      else if (this.points >= 40) {
        this.columns = 4;
        this.rows = 3;
      }
      else if (this.points >= 25) {
        this.columns = 4;
        this.rows = 2;
      }
      else if (this.points >= 10) {
        this.columns = 3;
        this.rows = 2;
      }
      const deckArray = Array.from(Array((this.rows * this.columns) / 2), (_, i) => i + 1);
      const repeat = (a, n) => n ? a.concat(repeat(a, --n)) : [];
      this.items = this.shuffle(repeat(deckArray, 2)).map(item => ({ show: true, value: item }));
      this.hideAll();
    }, 500);
  }

  async show(): Promise<any> {
    this.buttonText = 'OK';
    this.showModal = true;
    this.content = this.name + ' -- You gained ' + this.points + ' points!! Yay!';
    this.title = 'Uh oh!! You lost!';
    if (typeof this.lastHighScore === 'number') {
      await this.getProgress(this.name);
      this.checkAndSaveNewHighScore(this.points, this.lastHighScore);
    } else {
      this.addNewHighscore({ username: this.name, highscore: this.points });
      this.lastHighScore = this.points;
    }
  }

  hide(): void {
    this.showModal = false;
    this.showTopScores = false;
    if (this.buttonText === 'Start') {
      this.name = document.getElementById("name")['value'];
      this.getProgress(this.name);
    } else {
      this.rows = 2;
      this.columns = 2;
      this.failureCount = 10;
      this.points = 0;
    }
    this.deckGenerator();
  }

  moreLives(): void {
    this.showModal = false;
    this.failureCount = 10;
  }

  getProgress(name): void {
    this.firestore.collection('flippers').valueChanges({ idField: 'userId' }).subscribe(data => {
      const dataElem = data.filter((elm: DataUser) => {
        return elm.username === name;
      });
      if (dataElem && dataElem[0]) {
        this.userId = dataElem[0].userId;
        // tslint:disable-next-line: no-string-literal
        this.lastHighScore = dataElem[0]['highscore'];
      } else {
        this.name = name;
      }
    });
  }

  async checkAndSaveNewHighScore(newScore, lastScore): Promise<void> {
    if (newScore > lastScore) {
      // save new score as high score
      try {
        const saved = await this.savenewHighScore({ username: this.name, highscore: newScore });
      } catch (err) {
        this.addNewHighscore({ username: this.name, highscore: this.points });
      }
    }
  }

  savenewHighScore(data): void {
    const userRef = this.firestore.collection('flippers').doc(this.userId);
    const removeOld = userRef.update({
      highscore: data.highscore
    });
  }

  async addNewHighscore(data): Promise<void> {
    await this.firestore.collection('flippers').add(data);
  }

  getTopScores(): void {
    const fireCollection = this.firestore.collection<any>('/flippers', ref => ref.orderBy('highscore', 'desc'));
    fireCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as DataUser;
        // tslint:disable-next-line: no-string-literal
        const id = a.payload.doc['id'];
        return { id, ...data };
      }))).subscribe(data => {
        console.log(data);
        this.topScores = data;
        this.showTopScores = true;
      });
  }


}
