import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { BookmarkModule } from '@modules/bookmark/bookmark.module'
import { CommandModule } from '@modules/command/command.module'
import { EvaluateModule } from '@modules/evaluate/evaluate.module'
import { MapModule } from '@modules/map/map.module'
import { MiscModule } from '@modules/misc/misc.module'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { AppTranslationsLoader } from './app-translations.loader'
import { AppComponent } from './app.component'
import { LayoutModule } from './layout/layout.module'
import { OverlayComponent, UserSettingsComponent } from './layout/page'
import { TradeModule } from '@modules/trade/trade.module'

const routes: Routes = [
  {
    path: 'user-settings',
    component: UserSettingsComponent,
  },
  {
    path: '**',
    component: OverlayComponent,
  },
]

@NgModule({
  declarations: [AppComponent],
  imports: [
    // routing
    RouterModule.forRoot(routes, {
      useHash: true,
    }),

    // translate
    TranslateModule.forRoot({
      loader: { provide: TranslateLoader, useClass: AppTranslationsLoader },
    }),

    // layout
    LayoutModule,
    // app
    EvaluateModule,
    CommandModule,
    MapModule,
    MiscModule,
    BookmarkModule,
    TradeModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
