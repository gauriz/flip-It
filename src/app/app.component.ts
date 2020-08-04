import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
// import { AngularFirestore } from '@angular/fire/firestore';
// import { AngularFireDatabase } from '@angular/fire/database';
import { trigger, style, animate, transition, keyframes, state } from '@angular/animations';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

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
        animate('200ms', style({ transform: 'translateY(0)', opacity: 1 }))
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
  totalDeck = 3;
  showModal = false;
  content = '';
  buttonText = 'Start';
  name = '';
  // lastHighScore = 0;
  // userId: any;
  showTopScores = false;
  showCat = true;
  cards = ['https://cdn.worldvectorlogo.com/logos/emoticon.svg',
    'https://cdn.worldvectorlogo.com/logos/facebook-angry.svg',
    'https://cdn.worldvectorlogo.com/logos/facebook-wow.svg',
    'https://cdn.worldvectorlogo.com/logos/facebook-haha.svg',
    'https://cdn.worldvectorlogo.com/logos/facebook-love.svg',
    'https://cdn.worldvectorlogo.com/logos/facebook-sad.svg'
  ];
  points = 0;
  openCount = 0;
  // topScores: { username: string; highscore: number; userId: string; id: string; }[] = [];
  clickedIndex: any;
  constructor(private appTitle: Title,
    private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer
    //  private firestore: AngularFirestore,
    //   private db: AngularFireDatabase
  ) {
    this.appTitle.setTitle('FLIP IT!');
  }


  ngOnInit(): void {
    this.generateSVGs(Array.from(Array(this.totalDeck * 2), (_, i) => i + 1));
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
    this.items.map(item => item.show = false);
  }

  deckGenerator(): void {
    const deckArray = Array.from(Array(this.totalDeck), (_, i) => i + 1);
    const repeat = (a, n) => n ? a.concat(repeat(a, --n)) : [];
    this.items = this.shuffle(repeat(deckArray, 2)).map(item => ({ show: true, value: item }));
    setTimeout(() => {
      this.hideAll();
    }, 1000);
  }

  shuffle(array): number[] {
    return array.sort(() => Math.random() - 0.5);
  }


  checkClick(item, index): void {
    if (!this.itemClicked) {
      // firstTime
      this.items[index].show = true;
      this.clickedIndex = index;
      this.itemClicked = this.items[index].value;
    } else {
      // second time
      if (item.value === this.itemClicked) {
        // checking if the new item = previously clicked item
        this.items[index].show = true;
        delete this.itemClicked;
        this.points++;
        this.openCount++;
        this.checkCompletionandRedeck();
      } else {
        console.log('Not the same item');
        // the second item is not previously clicked item, so hide both;
        this.items[index].show = true;
        setTimeout(() => {
          this.items[this.clickedIndex].show = false;
          this.items[index].show = false;
          if (this.points > 0) {
            this.points--;
          }
          delete this.itemClicked;
        }, 100);
      }
    }
  }

  checkCompletionandRedeck() {
    if (this.openCount === this.totalDeck) {
      setTimeout(() => {
        this.hideAll();
        delete this.clickedIndex;
        delete this.itemClicked;
        this.openCount = 0;
        this.deckGenerator();
      }, 1000);
    }
  }

  hide(): void {
    this.showModal = false;
    this.showTopScores = false;
    if (this.buttonText === 'Start') {
      this.name = document.getElementById("name")['value'];
    }
    console.log(this.name);
  }


}
