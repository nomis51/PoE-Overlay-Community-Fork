import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core'
import Offer from '@modules/trade/class/Offer'
import { TradeService } from '@modules/trade/services/trade.service'
import { UserSettingsService } from 'src/app/layout/service'
import { TradeUserSettings } from '../trade-settings/trade-settings.component'
import { CommandService } from '@modules/command/service/command.service'
import { GridLocation } from '../trade-stash-grid/trade-stash-grid.component'

@Component({
  selector: 'app-trade-offers-container',
  templateUrl: './trade-offers-container.component.html',
  styleUrls: ['./trade-offers-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeOffersContainerComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private cd: ChangeDetectorRef,
    private tradeService: TradeService,
    private settingsService: UserSettingsService,
    private commandService: CommandService
  ) {
    this.tradeService.offers.subscribe(this.handleNewOffer.bind(this))
    this.tradeService.tradeAccepted.subscribe(this.handleTradeAccepted.bind(this))
    this.tradeService.tradeCancelled.subscribe(this.handleTradeCancelled.bind(this))

    this.setGridLocation()
  }
  /**
   * List of the current trade offers received and not ignored, removed or completed yet.
   */
  public offers: Offer[] = []

  /**
   * Currently selected offer
   */
  public currentOffer: Offer = null

  /**
   * Show/Hide the item highlight grid
   */
  public highlight = false
  public searching = false
  public showGrid = false
  public dropShadow = true
  public darkerShadow = false

  /**
   * Grid Resizing
   */
  public gridLocation: GridLocation = {
    top: 0,
    left: 0,
  }
  public gridDemo = false
  public pxTop = () => `${this.gridLocation.top}px`
  public pxLeft = () => `${this.gridLocation.left}px`

  /**
   * Set the grid location based on the settings
   */
  private setGridLocation(): void {
    this.settingsService.get().subscribe((settings) => {
      const tradeSettings = settings as TradeUserSettings

      let changes = false

      if (tradeSettings.tradeOverlayHighlightLeft) {
        changes = true
        this.gridLocation.left = tradeSettings.tradeOverlayHighlightLeft
      }

      if (tradeSettings.tradeOverlayHighlightTop) {
        changes = true
        this.gridLocation.top = tradeSettings.tradeOverlayHighlightTop
      }

      if (changes) {
        this.cd.detectChanges()
      }
    })
  }

  /**
   * Handles trade cancelled messages from chatListener
   */
  private handleTradeCancelled(): void {
    this.resetOfferTrades()
  }

  /**
   * Handles trade accepted messages from chatListener
   */
  private handleTradeAccepted(): void {
    const index = this.offers.findIndex((o) => o.tradeRequestSent)

    if (index !== -1) {
      this.settingsService.get().subscribe((settings) => {
        const tradeSettings = settings as TradeUserSettings

        if (tradeSettings.tradeAutoWhisper) {
          this.sendThanksWhisper(this.offers[index])
        }

        if (tradeSettings.tradeAutoKick) {
          this.kickBuyer(this.offers[index].buyerName)
        }

        this.offers.splice(index, 1)
        this.cd.detectChanges()
      })
    }
  }

  /**
   * Handles new offers coming from the chatListener
   * @param offer New offer to add to the overlay
   */
  private handleNewOffer(offer: Offer): void {
    if (offer) {
      this.offers.push(offer)
      this.cd.detectChanges()
    }
  }

  public ngOnInit(): void {}

  public ngAfterViewInit(): void {}

  public ngOnDestroy(): void {}

  /**
   * Remove an offer from the list of trade offers
   * @param offer Offer to remove
   */
  public ignoreOffer(offer: Offer): void {
    const index: number = this.offers.findIndex(
      (o) =>
        o.time === offer.time && o.itemName === offer.itemName && o.buyerName === offer.buyerName
    )

    if (index !== -1) {
      this.offers.splice(index, 1)

      if (this.currentOffer === offer) {
        this.currentOffer = null
      }

      this.cd.detectChanges()
    }
  }

  /**
   * Remove the offer marked as Trade Accepted
   */
  public removeAcceptedTradeOffer(): void {
    const index: number = this.offers.findIndex((o) => o.tradeRequestSent)

    if (index !== -1) {
      this.offers.splice(index, 1)
      this.currentOffer = null
      this.clearHighlight()
      this.cd.detectChanges()
    }
  }

  /**
   * Reset the property tradeRequestSent to false on every offers
   */
  public resetOfferTrades(): void {
    for (const o of this.offers) {
      o.tradeRequestSent = false
    }

    this.cd.markForCheck()
  }

  /**
   * Remove the offer from the list of trade offers AND kick the buyer of the offer out of the party
   * @param offer Offer to remove
   */
  public removeOffer(offer: Offer): void {
    this.kickBuyer(offer.buyerName)
    this.ignoreOffer(offer)
  }

  /**
   * Kick a buyer out of the pary
   * @param name Name of the buyer to kick
   */
  public kickBuyer(name: string): void {
    this.clearHighlight()
    this.commandService.command(`/kick ${name}`)
  }

  /**
   * Replace the special variables in the whisper to their value
   * {item} => Item name
   * {price} => Price of the item
   * @param text Text of the whisper
   * @param offer Offer related to the whisper
   */
  private insertWhisperVars(text: string, offer: Offer): string {
    return text
      .replace('{item}', offer.itemName)
      .replace('{price}', `${offer.price.value} ${offer.price.currency}`)
  }

  /**
   * Send a "Thanks" whisper to the buyer
   * @param offer Offer related to the whisper
   */
  public sendThanksWhisper(offer: Offer): void {
    this.clearHighlight()

    this.settingsService.get().subscribe((settings) => {
      const tradeSettings = settings as TradeUserSettings

      this.commandService.command(
        `@${offer.buyerName} ${
          tradeSettings
            ? this.insertWhisperVars(tradeSettings.tradeThanksWhisper, offer)
            : 'Thanks!'
        }`
      )
    })
  }

  /**
   * Send a "Are you still interested in my Item X listed for Price Y?" to the buyer
   * @param offer Offer related to the whisper
   */
  public sendStillInterestedWhisper(offer: Offer): void {
    this.clearHighlight()

    this.settingsService.get().subscribe((settings) => {
      const tradeSettings = settings as TradeUserSettings

      this.commandService.command(
        `@${offer.buyerName} ${
          tradeSettings
            ? this.insertWhisperVars(tradeSettings.tradeStillInterestedWhisper, offer)
            : `Are you still interested in my ${offer.itemName} listed for ${offer.price.value} ${offer.price.currency}?`
        }`
      )
    })
  }

  /**
   * Send a "I'm busy" whisper to the buyer
   * @param offer Offer related to the whisper
   */
  public sendBusyWhisper(offer: Offer): void {
    this.clearHighlight()

    this.settingsService.get().subscribe((settings) => {
      const tradeSettings = settings as TradeUserSettings

      this.commandService.command(
        `@${offer.buyerName} ${
          tradeSettings
            ? this.insertWhisperVars(tradeSettings.tradeBusyWhisper, offer)
            : `I'm busy right now, I will send you party invite when I'm ready.`
        }`
      )
    })
  }

  /**
   * Send a "Sold!" whisper to the buyer
   * @param offer Offer related to the whisper
   */
  public sendSoldWhisper(offer: Offer): void {
    this.clearHighlight()

    this.settingsService.get().subscribe((settings) => {
      const tradeSettings = settings as TradeUserSettings

      this.commandService.command(
        `@${offer.buyerName} ${
          tradeSettings
            ? this.insertWhisperVars(tradeSettings.tradeSoldWhisper, offer)
            : `Sorry, my ${offer.itemName} is already sold.`
        }`
      )
      this.ignoreOffer(offer)
    })
  }

  /**
   * Send a trade request command to the buyer
   * @param offer Offer related to the trade request
   */
  public sendTradeRequest(offer: Offer): void {
    this.clearHighlight()

    this.commandService.command(`/tradewith ${offer.buyerName}`)
    offer.tradeRequestSent = true
  }

  /**
   * Send a party invite to the buyer
   * @param offer Offer
   */
  public sendPartyInvite(offer: Offer): void {
    this.clearHighlight()

    this.commandService.command(`/invite ${offer.buyerName}`)
    offer.partyInviteSent = true
    this.currentOffer = offer

    this.cd.detectChanges()
  }

  /**
   * Show/Hide the highlighting grid
   * Do/Undo the in-game search
   */
  public highlightItem(): void {
    this.settingsService.get().subscribe((settings) => {
      const tradeSettings = settings as TradeUserSettings

      if (this.currentOffer) {
        this.highlight = !this.highlight

        if (tradeSettings.tradeOverlayHighlight) {
          this.showGrid = this.highlight
          this.dropShadow = tradeSettings.tradeOverlayHighlightDropShadow
        }

        if (tradeSettings.tradeInGameHighlight) {
          this.searching = this.highlight

          if (this.searching) {
            this.commandService.ctrlF(this.currentOffer.itemName)
          } else {
            this.commandService.clearCtrlF()
          }

          this.darkerShadow = false
        } else {
          this.darkerShadow = true
        }
      } else if (this.showGrid || this.searching || this.highlight) {
        this.showGrid = false
        this.searching = false
        this.highlight = false
      }

      if (tradeSettings.tradeInGameHighlight || tradeSettings.tradeOverlayHighlight) {
        this.cd.detectChanges()
      }

      if (!this.showGrid && this.gridDemo) {
        this.gridDemo = false
      }
    })
  }

  /**
   * Hide the highlighting grid
   * Clear the in-game search
   * **Required if you want to send chat command/whispers**
   */
  public clearHighlight(): void {
    if (this.showGrid) {
      this.showGrid = false
      this.cd.detectChanges()
    }

    if (this.searching) {
      this.commandService.clearCtrlF()
    }
  }

  /**
   * Update the grid position XY. In pixels
   * @param side left (x) or top (y)
   * @param value how many pixel
   */
  public updateGridPosition(side: string, value: number): void {
    switch (side) {
      case 'top':
        this.settingsService.get().subscribe((settings) => {
          const tradeSettings = settings as TradeUserSettings
          this.gridLocation.top = value

          tradeSettings.tradeOverlayHighlightTop = this.gridLocation.top
          this.settingsService.save(tradeSettings)

          this.cd.detectChanges()
        })
        break

      case 'left':
        this.settingsService.get().subscribe((settings) => {
          const tradeSettings = settings as TradeUserSettings
          this.gridLocation.left = value

          tradeSettings.tradeOverlayHighlightLeft = this.gridLocation.left
          this.settingsService.save(tradeSettings)

          this.cd.detectChanges()
        })
        break
    }
  }

  /**
   * Put the grid in demo mode.
   * Display all the square of the grid with borders
   * **It clears the Ctrl + F search command**
   */
  public setGridDemo(showGrid: boolean = false): void {
    this.gridDemo = !this.gridDemo

    if(showGrid) {
      this.showGrid = this.gridDemo;
    }

    // Otherwise it's too dark to clearly see the stash tab squares
    if (this.searching) {
      this.commandService.clearCtrlF()
    }

    this.cd.detectChanges()
  }

  public checkIfdemo():void{
    if(!this.currentOffer && this.showGrid){
      this.showGrid = false;
    }
  }
}
