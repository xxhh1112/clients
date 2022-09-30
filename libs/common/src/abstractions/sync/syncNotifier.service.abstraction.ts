import { Observable } from "rxjs";

import { SyncEventArgs, SyncSuccessfullyCompletedEventArgs } from "../../types/syncEventArgs";

export abstract class SyncNotifierService {
  sync$: Observable<SyncEventArgs>;
  syncCompletedSuccessfully$: Observable<SyncSuccessfullyCompletedEventArgs>;
  next: (event: SyncEventArgs) => void;
}
