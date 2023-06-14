import { TestBed } from '@angular/core/testing';

import { CallbackDispatcherService } from './callback-dispatcher.service';

describe('CallbackDispatcherService', () => {
  let service: CallbackDispatcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CallbackDispatcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
