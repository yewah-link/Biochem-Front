import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Correct icons
import { faXTwitter, faFacebookF, faLinkedinIn, faInstagram } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
  ],
  templateUrl: './footer.html',
  styleUrls: []
})
export class Footer {
  faFacebook = faFacebookF;
  faX = faXTwitter;       // Correct X.com icon
  faLinkedin = faLinkedinIn;
  faInstagram = faInstagram;
}
