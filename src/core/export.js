/* ============================================================
 * EXPORT.JS — PDF reports, Excel exports, Receipt printing
 * RISEVANILLA - Gestion de Collecte de Vanille
 * ============================================================ */

'use strict';

/* ── Logo RISEVANILLA (base64 inline — résout le problème des chemins relatifs en popup) ── */
const _LOGO_B64 = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDYyMCA2MjAiIHdpZHRoPSI2MjAiIGhlaWdodD0iNjIwIj4KCTxkZWZzPgoJCTxpbWFnZSB3aWR0aD0iMTc0IiBoZWlnaHQ9IjE5NSIgaWQ9ImltZzEiIGhyZWY9ImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBSzRBQUFERENBTUFBQUFzdU5wWUFBQUFBWE5TUjBJQjJja3Nmd0FBQW9WUVRGUkY4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXckFBQUE4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjZXaG9uQUFBQU5kMFVrNVRqUC93NU5uT3Y1cHJQQXNBcU42alhCTEJ4Mzh6RHRja0hPWE5iQ2p4MzE0Q1B2blZVZjdGSjNINmlRcVA0MHNCcnBBRUJza1k2ajhiL1Z0aWNGVitrWFJmTW9mZ0NXN3RqU0NlK3hZc2lPSDNEZUlGYVpORVBhWVBzUkJ6YlVmek1STmxxYmIxQXhueWQ5MnZZZXNpZkZpaWdjYnBET2pJTjFabm5LcSsyMnI4WUUzWUlYdElKYWM0MDl4SkhybHZGTkN3T3VaUTFvT0s5aFVIMFIvdmxCbzVuK2VydElzcEZ5Nnl1SVJVN2thU3c4eEFlSG1id0N1cytCMkZMN3FYTkdSb3Bjc0lja1U3TmV5MVhabTNobE85Mm1iME1NcFFpWm9FQUFBSlFrbEVRVlI0bk5XZGVYQlBWeFRIN3kyVDJsSlVZeXpWQ1EzU1lxclNsRlJSaVNXTUVWdEVSNGl0cGFGcUo0UVFTMHRWWTB1dFFZWldRNHJhMjZHMVRvdGFxblJYU3F1cU16clZsaWxEZjBra3Y3ZS8rNzN2M1h2YjcxL3YzWGVPMzRmMys3Mzc3cm5uSEpSUUlrVzBSSjcrbFBMMEw3K0kyRlFoUUh5TDE1bVdKeUcvKzBuRHBNcVUzdUJ5RE9DV28xZDlwbUZScVlxbC84UzlBcmdrbFA3aVB3NkRxbFA0dmhiZ0J1N05KUUUwREtwRndUdGJpRXVxMGgrRTRMaXJEcjJNbUJmaEJ1N0xkMEpvR0ZRWHViWDNjRW10cjhYQU1DaVMwdk9zdHNXNHBQWVpNVEFzYWtpL1o3UXN3WTJncDBUUk1LZ3haYnU3SmJnazhwejg2U0tvS0hxV3hTeUlxMmk2S0ZZMC9ZTEJTb05MR2gyOUk0ekdYYzFZdm8xYVhIWFRSYUVpcXA1MHRkSGhLcHd1Q3RYOGhKdUZIcGMwT1NpTWhVVVAzblF4TU9DcW5DNEsxT0l6NSt0R1hQTFVmbUVzTEdwMTFQR3lDVmZ0ZEVGSURjZW52d21YcUZoZGFQWGNFWWVMRnJocXB3c1NXZjFUKzRzV3VJcW5DMUx0aHYzSzB3cFg4WFJCS2xXMHZiMld1S1NoMC9kSHZHSS9zYnRpamF0eWRSRlF4S1g3Yks3WTRDcWVMdUxvWWVzTGRyaUtwNHVXeDZ6SGJYSFZUaGQyWHdkYlhNWFRSYW43TFljZGNOVk9GMjBQV1kwNjRLcWRMdG9kLzl0aTFBbFg3WFRSL29ERm9DT3UwdFZGWkxqRnM4a1pWK2wwMFdHZmVjd0ZWK1YwMFpGK1pCcHp3L1dvV0VyZjUzWis3SUpwU0RCdVFBMnJoR3poODZRSkg1aUdoT01HbmtsSG1tN2ljalF2M0dUZ0VoSlBOL0U4d2l2VU1mN1E1ZUFTOGt5bGt4elBtTVR0aGdGWnVJUjB1b24vNkpLMkdnYms0WkxPOUIzVUpiTEpadjJBUkZ4Q3VxNURQWkxmMDU5THhTWGRhUzdtVVBjbi9ibGNYSko0RitUdGw2YzdsWXhMN3NUdWdPd2YrVTEzS2h1WEpLMkN6QWVzMTUxS3h5WFByMFNzQjFIZHoxTStiakpkaXBpWDBhMHg1ZU9TYUl2M1dIc04wZjAyRmVDU2xMY0E0OVRWMmpNVnVQMFhBOGJEY3JSbktuRHJYMGJTUFY3Vy9qUlY0SkpCQ3dEalY1WnJUcFRnaG9ZQ0w1TzZ6U3NsdUtUbXQreTJJNVpwVHRUZ0RuNlQzWGJVRXMySkd0eXE1OWx0UjJzZmUycHdVK2NDeG0wMG9XazF1R1RvNit5MjlUU0JPa1c0dythdzI0NWZHRHhXaEpzQUxOdjY1QWVQRmVHMjJzbHVPMEV6cWZ3UGNOUG1CNDhWNFk2WXhXN2JXeE94VW9RN2NpYTc3WDhBZDlRTWRsdnRwb29pM05IVDJXMm5hT1lVTmJpOWEweGpOKzcvYnZCWURXN3NOc0JZbXo2aUJuZmNWTUI0MnV6Z3NScmNqaHNCNHlxYUlnQTF1Qk9tQU1aTlR3ZVBsZUNtVFFhTUk4cHBWa3BLY0NlbUE4YlIyclJ0SmJodGtMQi8xSmVhRXhXNGt5WWgxaUdsTlNjcWNKR1hYZjJrcGdJM2ZTSmtybDFNcU1DZG5BYVphMWVXQ25DblRJRE1aK3ZlTHFUalJ2WWFCOWszL2taN0poMjNubnMrdkU0emRTL3lzbkdualFVZHl1bk9KT05tanIyTE9ieWhuNi9sNHFabTNRWTk1dW5uYTZtNDRaZXZnUjdOa3ZRem9FemM1TWRIb0M3ekRjOW9pYml2WFFUaWVQZlV5RkRJSmcrMzd4SjNHNk1XampjTXlNS2RRNGR5ZUdXUE1Rekl3RzFkTHZZNk5wWGQweEk2MGpDQzRDS0JMVitrbjRBTGhPQm0wUmY4aEhGVjdiWnJqVVBRbDJFQkhlZ2pqYXR5aHBtR3NPL3VvNmZkYmZ6VEt2T3ZFL3lwelUzMWk4VmRWclYySUc3WXo5eWRJRkJsYnJMSXhVVWZaRDF6WmVXanI3YTZrZkJ6dDJ6WVYzN0F1R3JOUzFhaitEUXhKdE03aTd0eWQyMjJHdWFZMVpiMjhRempxb3l5MXY4b0hMamhRM21tZjB5OWJmS1RlZDRaS3NTRG1ZR3cxcjVvYzRIckZXZDhoaGNXZDgzNU5kdm1DdDhiMmZMZUhtQmNGZDM1VmJ0TGZMajFXOC9qcDNGVHUzNkRiSzl4dnUrdVBJNHZaQmpWdCtNQSs0dThyK2ZaZVZoaUs3TVNZcHllNjl5ckNVSFZOVFRSY2N1TmYvR3pLb25YMDBHWk5ZWTdYdWZIVFMwTDdPc3lLaS9GcFZ1Wmg2WGxpcjBydUgydHRXRzZXL2FlbDVWd2JnOStYd3ZsMDJSWEcwOEw5M1ZkUFRnYnRYbUhhU0ZwbGlmYytsTVRQSGpybEhGdEMwdmRyTGV3U1BJSjU5NGF6S3FRenZZVzdUR0tzMzZXYmJFL29NR2RMalBHSnIwR25mSTZlZk1QcU5ua2JITlJwWTA4eDhpbWovYjRCK3lnM2RtTlBlTjJ1YkxIZzNkR1RBNlM1K0pEQkRLbmNudGUxNVZsd3JwZ0hqNEVUQi82a2M5ditibWpOazBqN09WSGZQZjJQN2hQV0hJWWtQbFdJajl3NHp1QWdkVEpMV2xudm8veUpYcU9CbEpIUWtWS1d2a1Q3Ri9iRGJQZjJKZnpnM3phbTBBcUN3ck11NE5QaEdMNXRaV3lOUTR5SDdlSTcyUDh3dTJ5SGd1azd1V2J2SDNicU5yZUdyUC91Q1BQcC9pM3I3YXpGV1NlY2RaWXY4NGlIN2NCZDdXRXpBZjE0bmoyK29pYmRRc0xwQzRNTWU1SnVzdlBUZGEwcFZoZm1nTzBIZm9SdnU0Sm80SFUvZkhvSi9pN2hSMW43S2Znb2tOdHdRL3dlY2NkS1RBbzBPRTJtTDNQdUQzRHNFRHF3Nm5ZMzgvdmZJWTlNWmg5cmJnOGQ2T2dmRSsvbURFS3M2K1VpTFRFOEQ5YkJOMTJhNEIwdWZJZk4vd3EySFV0QnVpQ0p5QVhCdzJrN3E0WXkyd3JJblVJRGFSR1A4a1FleXlTa0V3bnRPVjdWaHJyZi9FaEJCZmVkdHN6Z1BIN0xpYVBiR1dkcHBnRDYrTkJVTm9iSEVnZHl0YlFSVlNXSHByeDZOZ2tPQ2hoU1lYb3RsdTFLSllncnpCY2VOdXRlZ09HQUorNGxNMFZWY0JBNnBGRTk4ZUR3QXpUZmRHZ3d6SDN0YW5JaE5odDdKTnJrWXpkeDh3U2lSdWZBbTY3WmN5MmE4SmNMS0hweHFIWndDNUpnZktYdS9SVUZwc2R2WFljMko0dzh3KzdwS0VpQ1U3bWpyTHFTdXVrZ1VjZC80S2ljODhQUklFT0cxS2Nyb3JHeGJmZEhuQ3FzeEdlMlo4ekZjeEl6UWh4Nk4wZ3ZoQUJiSjVIOUZYaUJrbW9teWgxSFhSd2VOdVJnSXZYTDFSdXZjdm1pb3lxbElHTHdKbzZ5N2JSaFpKUzg0TnV1eGtiL2dVbHAwVHBZQlBRSVdKRGM4dHhTUlZWaHh1akhnc3N5NGtsNGVMMUM5WnZPN0xxMWNvMlJUTlNUOFZaTk8yWFZnM1lqVG13Vkt6MEsrWlFxcnppUmJ4K29ZZjVoc2pERGI5NURuWDV2Smx4UkdJbEsxNi9ZTjZJbFZrbmpOY3ZuQjV1aU8xSXJjSnVzUnYxaUU3U2Q5Q1Jpc3RSdjdCNGpDNzBLN2NrbjZOK1FWOVBJN25oQVVmOWdpNjJJN3VkQk5hSnVWQXpOT1hKMHB0MWNOUXZQSHU4NUZBNkxrZjl3dTZhVHhjZnltODBrMzloQ09xU1c2MDQ3VXhCR3grTytvWEZHZmZlemxUMGRJSjZ2UldwdUNPS0NsdzRrQnJRaDBVdVN2cVJoVDVoK2g5eFhMV29zTU9EbWw1NkhQVUxTN2J0SmNxNmJFS2R6NHVVKy9aK1piaGttWHM1a2xGeFBVY3F3KzF5NENMc2N5WmFHUzVKWElQNzdJOVhoa3NhdzFVSWhMVDZGKzVYem1tL3cyQkFBQUFBQUVsRlRrU3VRbUNDIi8+CgkJPGltYWdlIHdpZHRoPSIxNDUiIGhlaWdodD0iMjM4IiBpZD0iaW1nMiIgaHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFKRUFBQUR1Q0FNQUFBQU9jaFVGQUFBQUFYTlNSMElCMmNrc2Z3QUFBUHhRVEZSRkFBQUE4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjgrV3I4K1dyOCtXcjllM3YwUUFBQUZSMFVrNVRBRFAvOXZYMDgvSHc3Kzd0NitycDZPZmw1T1BpNE4vZTNkemEyZGpYMWRUVDB0SFB6czNNeXNuSXg4YkV3OExCUVpEc0NndGcvaXJBdUNCSWdBSjRFN0NnRlBvNGNOQ0kreDB1QlZDWU1GZ0lRS2hvMEs5WER3QUFCOU5KUkVGVWVKeTFuTTl2bFVVVWh2dXhjNHRibzB2RHFqVldrVkpBSzlTRVVpdjZkNnJGWDBSRnNWVEZpb2F3VW5adTNMSFdqU1o2eisyOXZlYzdNOS9NYytiTXM2QzN0Wk04SklaMzhyNzNmc05hUDRaaDhSWFIwZWlWSi96TVJrK2p6ZC8vNG9mV0gzYzBldTFYZm1aek9PbG85TWJQL016RmgydjlqTGIrK1lVZnV2UkRSNlB0SC9tWjh4ZU8reGxkZWZxTUg5cCtzTmJQNlBKRGZ1YmM1YU9PUm04KzRHZXUzVi9yWjdRejNIY2N1cmZXeitqR04vek15Ny9OL3V4bHRIdVBuM24xMGV6UFRrYlh2K1ZuTmdiNVI3NlQwVnRIL015TkwrVkxINlBOSi8vaU03dkRYZm5heDhnVHNsZS9tMy90WStRSjJmOGpUZWhpZFBNWkQ5a1hYanFlditoaTVMazh2djMxNllzZVJudEgvUElva1NiME1McjFCVCt6OStuaVZROGpUOGplK21UeHFvT1JKMlRua1NaME1McjZQVCt6ZjJmNU10N0ljM25jZVBGdytUcmU2UGFkOHUrTU9ZMDBJZDdJRWJLTFNCUENqVHdoKzk1SEs5K0VHMzN3TVQ5enNIb20zTWh4ZVZ4R21oQnQ5TzVuL016dEQxZS9pelp5aE95NWRYV2JDamJ5aE94WnBBbkJSbzZRM1J4TzFQZkJScGRPeXI4ejR2V2Y5UGV4UnA2R1puLzBiM3lza2FPaE9iOTlxSDhRYXVRSjJlM3haU3JVeUJHeXUzK1BZekRVNlAzRDh1K01VSkVtUkJwNUxvODdKblFpalJ3TnpmV3Z6SThpalJ3aHF5Tk5DRFJ5aE94cFFhTUlOTnIvSEI5WmYyeC9GbWZrdUR5T0kwMklNM0kwTkJkVERYT2NrYU9odVpuNlB5L015Qkd5SnRLRU1DTkh5SnBJRTZLTTloN2hrRDByYUJSUlJvN0w0N1YwNWtRWk9Sb2FHMmxDa0pFalpGY0tHa1dRa1NOazU1dURKY2JveXA5LzBDT3BTQk5pakJ5WHg5V0NSaEZqeEJ1YXplZnZadjVMaUpFalpKT1JKb1FZT1VKMnNUbFlRb3g0eU9xQ1JoRmg1SmhCbHB1REpjS0lOelNaU0JNQ2pCd056YWlnVVFRWU9VTDJiSE93QkJqeGtNMUZtdEJ1dFBVY0R0bHhRYU5vTitLWHg5WE53ZEpzNUdob3NwRW1OQnZ4a0ZXYmc2WFppSWVzTFdnVXJVYU9rRDJZM2lsYWpmZ01NaEZwUXFzUmIyZ1NCWTJpMFlnM05LUE53ZEpveEVOMkt0S0VOaU1lc3NtQ1J0Rm1kRkQ2Q3h2R200T2x6WWhmSGljalRXZ3k0ZzFOdXFCUk5CbnhrTjBxdnp1aHhZaUhiQ0hTaEJZai9rYlZRcVFKTFViODhwZ3BhQlFOUnJ5aFNXd09sZ1lqM3RDVUlrMW9NTUlobXkxb0ZINGpIcktwemNIaU44SXpTRG5TQkxjUnZ6em1DeHFGMjRnM05Nbk53ZUkyd2lGYkVXbUMxNGlIYkhwenNIaU4zc2tYUUdtbUNocUYwNGhmSGpPYmc4VnB4QnVhbWtnVG5FWTRaQ2NMR29YUGlJZHNibk93K0l4d3lOWkZtdUF5NGpQSWRFR2pjQm5oaGlhL09WaGNScmlocVl3MHdXUEVRemEvT1ZnOFJqaGtaeC9kcThaamRPRXBQRkFiYVlMRENGOGVxeU5OY0JqaGhxWlkwQ2k0RVEvWnFjM0J3bzF3eU5aSG1zQ044QnRWeXdXTkFodmh5K1AwNW1EQlJyaWhBWkVtVUNQYzBOUVVOQXBxaEVOMjhkRzlhcWdSRGxrU2FRSTAyam1HSVZ2YUhDelFDRjhlcXdvYUJUU2lEVTF4YzdBd0l4eXlMTklFWmtSRHRyS2dVU0FqL0x5Tzh1WmdRVWI0OGdnalRVQkd0S0dwTFdnVXhBaUhiTVhtWUNGR05HUnhwQW5BQ0lkc3plWmdBVVo0QmluTTZCbUFFVzFvZUtRSjlVYTRvZUdSSnRRYjBaQUZCWTJpM29pR2JOM21ZS2syb3MvcjhFU2FVRzFFTDQra29GSFVHdUdHcG5KenNOUWEwWkIxUlpwUWEwUkRGaFUwaWtvaitrWlYrOUc5YWlxTjZPWFJGMmxDblJGdWFLbzNCMHVkRVcxb1lFR2pxRE9pSVZ1L09WaXFqR2pJZWlOTnFES2l6K3VnQlkyaXhvaGVIc25tWUtreG9nMk5POUtFR2lNYXNyaWdVVlFZMFpCRm00T2x3b2krVWRVZmFVS0ZFYnc4c3MzQlVqYWlEVTMxako2aGJFUkR0aUhTaEtJUkRkbVdTQk9LUmpSa1BRV05vbWdFWnhDNk9WaEtSclNoYVlvMG9XUUVHeHBmUWFNb0dOR1F4WnVEcFdCRVE3WXQwb1NDRVh4ZWg3T2dVVXdiMGN2anhFZjNxcGsyZ2cxTmE2UUowMFl3WkIyYmcyWFNDSWFzdTZCUlRCckJrUFZzRHBZcEl6cURORWVhTUdVRUd4cC9RYU9ZTW9JTmpXdHpzRXdZd1pBTmlEUmh3Z2lHYkVOQm84Z2IwZWQxK0RZSFM5NElYaDRqSWszSUc4R0d4cms1V0xKR01HU2JDaHBGMWdpR3JIZHpzT1NNNEJ0Vll5Sk55Qm5CeTJOYlFhUElHY0dHeHIwNVdESkdzS0VKaWpRaFl3UkR0ckdnVVdTTVdNZzJiQTZXdEJHY1FhSWlUVWdid2N0amEwR2pTQnJCaHFicW8zdlZKSTFneUlaRm1wQTBZaUViRjJsQ3lnZytyNk85b0ZHa2pOamxzVzF6c0NTTVlFTVRHR2xDd2dpR2JFQkJvMGdZc1pCdDNCd3MxZ2lHYkdTa0NkYUl6U0FoQlkzQ0dyR0dwblZ6c0JnajJOQ0VScHBnakZqSU5tOE9sckVSRE5tWWdrWXhObUxQNjJqZkhDeGpJM1o1REk0MFlXVEVHcHFvZ2tZeE1tSWhHN0E1V0xRUkRObm9TQk8wRVh1amFsaEJvOUJHN1BJWXNUbFlsQkZyYU9JalRWQkdyS0VKMlJ3c3lvaUZMUHZvWGpXclJpeGtPMFNhc0dyRW50ZlJJZEtFRlNOMmVZd3NhQlFyUnF5aENkb2NMQ3RHS0dTN1JKcHdac1JDTnJTZ1Vad1pzZWQxUkcwT2xxVVJ1enoyaVRSaGFjUWFtdGlDUnJFMFFpSHIrT2hlTlFzakZyS2RJazFZR0tHUURkd2NMS2RHYkFhSkxtZ1VwMGFzb1FuY0hDeW5ScWloNlJacHd0eUloV3g0UWFPWUc2R1FEZDBjTEhNajlMeU9mcEVtaUJHN1BNWVhOQW94UWcxTjdPWmdtUm14a08wWWFjTE1DSVZzOE9aZ21SbWhONnJHemVnWkJuaDU3QnBwd2dBYm1xNlJKZ3l3b2VsUzBDZ0dGckxobTRObFlDSGJOOUtFQVQydm8xTkJveGpRNVRGK2M3QU1xS0hwSEduQ2YwMm1IbkF2QmhQR0FBQUFBRWxGVGtTdVFtQ0MiLz4KCTwvZGVmcz4KCTxzdHlsZT4KCQkuczAgeyBmaWxsOiAjMDAwMDAwIH0gCgk8L3N0eWxlPgoJPHBhdGggaWQ9IkNhbHF1ZSAxIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsYXNzPSJzMCIgZD0ibTIyIDBoNTc2YzEyLjE1IDAgMjIgOS44NSAyMiAyMnY1NzZjMCAxMi4xNS05Ljg1IDIyLTIyIDIyaC01NzZjLTEyLjE1IDAtMjItOS44NS0yMi0yMnYtNTc2YzAtMTIuMTUgOS44NS0yMiAyMi0yMnoiLz4KCTx1c2UgaWQ9ImltZzEiIGhyZWY9IiNpbWcxIiB0cmFuc2Zvcm09Im1hdHJpeCgxLjMzNCwwLDAsMS4zMzMsOTIuMDM2LDE2Ny4zMzMpIi8+Cgk8dXNlIGlkPSJpbWcyIiBocmVmPSIjaW1nMiIgdHJhbnNmb3JtPSJtYXRyaXgoMS4zMzQsMCwwLDEuMzMzLDI5My40OSwxNjYpIi8+Cjwvc3ZnPg==';

/**
 * Bloc HTML d'en-tête avec logo pour les documents A4 / impression.
 * @param {string} docType  - Ex : 'BON DE LIVRAISON', 'FACTURE', 'REÇU DE RÉCEPTION'
 * @param {string} [docNum] - Numéro du document (optionnel)
 */
function _logoHeader(docType, docNum) {
    const numLine = docNum
        ? '<div style="font-size:14px;font-weight:700;color:#333;">' + docType + '</div><div style="font-size:13px;color:#666;margin-top:3px;">N\u00b0\u00a0: ' + docNum + '</div>'
        : '<div style="font-size:14px;font-weight:700;color:#333;">' + docType + '</div>';
    return '<div style="display:flex;justify-content:space-between;align-items:center;'
         + 'border-bottom:2px solid #6750a4;padding-bottom:14px;margin-bottom:20px;">'
         + '<div style="display:flex;align-items:center;gap:10px;">'
         + '<img src="' + _LOGO_B64 + '" style="width:44px;height:44px;object-fit:contain;flex-shrink:0;">'
         + '<div>'
         + '<div style="font-size:20px;font-weight:700;color:#6750a4;line-height:1.2;">RISEVANILLA</div>'
         + '<div style="font-size:11px;color:#888;">Gestion de Collecte de Vanille</div>'
         + '</div>'
         + '</div>'
         + '<div style="text-align:right;">' + numLine + '</div>'
         + '</div>';
}

/**
 * Bloc logo compact pour le ticket thermique 80 mm.
 */
function _logoHeaderThermal() {
    return '<div style="text-align:center;margin-bottom:4px;">'
         + '<img src="' + _LOGO_B64 + '" style="width:12mm;height:12mm;object-fit:contain;">'
         + '</div>';
}



const _PDF_BASE_STYLE = `
    body{font-family:Arial,sans-serif;margin:20px;font-size:11px;color:#333;}
    h1{color:#6750a4;font-size:20px;margin-bottom:4px;}
    h2{font-size:14px;color:#444;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:20px;}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;}
    th,td{border:1px solid #ddd;padding:7px;text-align:left;}
    th{background:#f2f2f2;font-weight:bold;}
    .total{font-weight:bold;background:#f8f9fa;}
    .right{text-align:right;}
    .status-debiteur{color:#ba1a1a;font-weight:bold;}
    .status-crediteur{color:#2e7d32;font-weight:bold;}
    .status-equilibre{color:#625b71;}
`;

function _printWindow(html) {
    const w = window.open('', '_blank');
    if (!w) { showToast('Popup bloqué — autorisez les popups', 'error'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
}

// ── Analysis PDF ──────────────────────────────────────────────
function exportAnalysis() {
    const today = formatDate(new Date().toISOString().split('T')[0]);
    let rows = '';
    let totalDeb = 0, totalCred = 0;

    appData.collectors.filter(isCollectorAvailableInCurrentYear).forEach(c => {
        const adv  = getTotalAdvances(c.id);
        const pai  = getPaiementsForCurrentYear().filter(p=>p.collectorId===c.id).reduce((s,p)=>s+p.amount,0);
        const rec  = getTotalDeliveries(c.id);
        const remb = getRemboursementsForCurrentYear().filter(r=>r.collectorId===c.id).reduce((s,r)=>s+r.amount,0);
        const deb  = adv + pai;
        const cred = rec + remb;
        const bal  = cred - deb;
        const st   = getCollectorStatus(bal);
        if (bal < 0) totalDeb  += bal;
        if (bal > 0) totalCred += bal;
        rows += `<tr>
            <td>${c.name}</td>
            <td>${formatPhoneNumberForDisplay(c.phone)}</td>
            <td class="right">${formatCurrency(deb)}</td>
            <td class="right">${formatCurrency(cred)}</td>
            <td class="right">${formatCurrency(bal)}</td>
            <td class="status-${st.class}">${st.label}</td>
        </tr>`;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Analyse — RISEVANILLA</title>
    <style>${_PDF_BASE_STYLE}</style></head><body>
    ${_logoHeader('RAPPORT ANALYSE DES COMPTES')}<p style="margin-bottom:16px;color:#555;font-size:12px;">Généré le ${today}</p>
    <table>
        <thead><tr><th>Collecteur</th><th>Téléphone</th><th class="right">Total Débits</th><th class="right">Total Crédits</th><th class="right">Solde</th><th>Statut</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
            <tr class="total"><td colspan="4">TOTAL NON RÉCUPÉRÉ (Dettes)</td><td class="right status-debiteur">${formatCurrency(totalDeb)}</td><td></td></tr>
            <tr class="total"><td colspan="4">TOTAL CRÉDIT (Dû aux Collecteurs)</td><td class="right status-crediteur">${formatCurrency(totalCred)}</td><td></td></tr>
        </tfoot>
    </table></body></html>`;
    _printWindow(html);
}

// ── Poids Analysis PDF ────────────────────────────────────────
function exportPoidsAnalysis() {
    const receptionsYear = getReceptionsForCurrentYear();
    const today          = formatDate(new Date().toISOString().split('T')[0]);

    // ── Segmentation par vanilleType ─────────────────────────────────────
    const qualitesVertes   = [...new Set(receptionsYear.filter(r => getVanilleType(r.quality) === 'verte')   .map(r => r.quality))].sort();
    const qualitesPrep     = [...new Set(receptionsYear.filter(r => getVanilleType(r.quality) === 'preparee').map(r => r.quality))].sort();

    const totals = {};
    [...qualitesVertes, ...qualitesPrep].forEach(q => totals[q] = 0);
    let grandTotalVerte = 0, grandTotalPrep = 0;

    let rows = '';
    appData.collectors.filter(isCollectorAvailableInCurrentYear).forEach(c => {
        let colTotalVerte = 0, colTotalPrep = 0;

        const cellsVerte = qualitesVertes.map(q => {
            const w = receptionsYear.filter(r => r.collectorId === c.id && r.quality === q).reduce((s, r) => s + r.netWeight, 0);
            totals[q]      += w;
            colTotalVerte  += w;
            return '<td class="right">' + (w > 0 ? formatNumber(w) : '—') + '</td>';
        }).join('');

        const cellsPrep = qualitesPrep.map(q => {
            const w = receptionsYear.filter(r => r.collectorId === c.id && r.quality === q).reduce((s, r) => s + r.netWeight, 0);
            totals[q]     += w;
            colTotalPrep  += w;
            return '<td class="right">' + (w > 0 ? formatNumber(w) : '—') + '</td>';
        }).join('');

        grandTotalVerte += colTotalVerte;
        grandTotalPrep  += colTotalPrep;

        rows += '<tr>'
            + '<td>' + c.name + '</td>'
            + cellsVerte
            + '<td class="right subtotal">' + (colTotalVerte > 0 ? formatNumber(colTotalVerte) : '—') + '</td>'
            + cellsPrep
            + '<td class="right subtotal">' + (colTotalPrep > 0 ? formatNumber(colTotalPrep) : '—') + '</td>'
            + '<td class="right total">' + formatNumber(colTotalVerte + colTotalPrep) + '</td>'
            + '</tr>';
    });

    const thVerte = qualitesVertes.map(q => '<th>' + q + ' (kg)</th>').join('');
    const thPrep  = qualitesPrep.map(q => '<th>' + q + ' (kg)</th>').join('');
    const tfVerte = qualitesVertes.map(q => '<td class="right">' + formatNumber(totals[q]) + '</td>').join('');
    const tfPrep  = qualitesPrep.map(q => '<td class="right">' + formatNumber(totals[q]) + '</td>').join('');
    const grandTotal = grandTotalVerte + grandTotalPrep;

    const groupHeaderVerte = qualitesVertes.length
        ? '<th colspan="' + (qualitesVertes.length + 1) + '" style="background:#e8f5e9;color:#2e7d32;border-bottom:2px solid #4caf50;">🌿 Vanille Verte</th>'
        : '';
    const groupHeaderPrep = qualitesPrep.length
        ? '<th colspan="' + (qualitesPrep.length + 1) + '" style="background:#ede7f6;color:#4527a0;border-bottom:2px solid #6750a4;">✅ Vanille Préparée</th>'
        : '';

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Poids — RISEVANILLA</title>'
        + '<style>' + _PDF_BASE_STYLE + ' td.right{text-align:right;} th{text-align:center;}'
        + 'td.subtotal{background:rgba(0,0,0,.04);font-weight:600;}</style></head><body>'
        + _logoHeader('ANALYSE DES POIDS — Verte / Préparée') + '<p style="margin-bottom:16px;color:#555;font-size:12px;">Généré le ' + today + '</p>'
        + '<table>'
        + '<thead>'
        + '<tr><th rowspan="2">Collecteur</th>' + groupHeaderVerte + groupHeaderPrep + '<th rowspan="2">TOTAL (kg)</th></tr>'
        + '<tr>' + thVerte + '<th>S/Total Verte</th>' + thPrep + '<th>S/Total Préparée</th></tr>'
        + '</thead>'
        + '<tbody>' + rows + '</tbody>'
        + '<tfoot><tr class="total"><th>TOTAL GÉNÉRAL</th>'
        + tfVerte + '<td class="right">' + formatNumber(grandTotalVerte) + '</td>'
        + tfPrep  + '<td class="right">' + formatNumber(grandTotalPrep)  + '</td>'
        + '<td class="right">' + formatNumber(grandTotal) + '</td>'
        + '</tr></tfoot>'
        + '</table></body></html>';
    _printWindow(html);
}

// ── Excel: Analysis ───────────────────────────────────────────
function exportAnalysisToExcel() {
    if (typeof XLSX === 'undefined') { showToast('XLSX non disponible', 'error'); return; }
    const table = document.getElementById('analysis-table');
    if (!table) { showToast('Table introuvable', 'error'); return; }

    const headers = [...table.querySelectorAll('thead th')].map(th=>th.textContent.trim());
    headers.pop(); // Remove Actions
    const data = [headers];

    table.querySelectorAll('tbody tr').forEach(row => {
        if (row.querySelector('.empty-state')) return;
        const cells = [...row.querySelectorAll('td')].map(td=>td.textContent.trim());
        cells.pop();
        data.push(cells);
    });

    if (data.length <= 1) { showToast('Aucune donnée à exporter', 'error'); return; }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = headers.map(h=>({ wch: Math.max(h.length, 15) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analyse');
    XLSX.writeFile(wb, `Analyse_Collecteurs_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export Excel réussi!', 'success');
}

// ── Excel: Collector Details ──────────────────────────────────
function exportCollectorDetailsToExcel(collectorId) {
    if (typeof XLSX === 'undefined') { showToast('XLSX non disponible', 'error'); return; }
    const collector = appData.collectors.find(c => c.id === collectorId);
    if (!collector) { showToast('Collecteur introuvable', 'error'); return; }

    const advances       = getAdvancesForCurrentYear().filter(a=>a.collectorId===collectorId);
    const receptions     = getReceptionsForCurrentYear().filter(r=>r.collectorId===collectorId);
    const remboursements = getRemboursementsForCurrentYear().filter(r=>r.collectorId===collectorId);
    const paiements      = getPaiementsForCurrentYear().filter(p=>p.collectorId===collectorId);
    const bal            = calculateCollectorBalance(collectorId);

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Rapport Détaillé du Collecteur'], [],
        ['Nom:', collector.name], ['Téléphone:', formatPhoneNumberForDisplay(collector.phone)],
        ['CIN:', collector.cin||'N/A'], ['Adresse:', collector.address||'N/A'], [],
        [`RÉSUMÉ FINANCIER (Année ${currentYear})`],
        ['Total Avances:', advances.reduce((s,a)=>s+a.amount,0)],
        ['Total Réceptions (Valeur):', receptions.reduce((s,r)=>s+r.totalValue,0)],
        ['Total Remboursements:', remboursements.reduce((s,r)=>s+r.amount,0)],
        ['Total Paiements:', paiements.reduce((s,p)=>s+p.amount,0)],
        ['Solde Actuel:', bal]
    ];
    const ws0 = XLSX.utils.aoa_to_sheet(summaryData);
    ws0['!cols'] = [{wch:28},{wch:25}];
    XLSX.utils.book_append_sheet(wb, ws0, 'Résumé');

    // Avances — avec colonne Type vanille
    if (advances.length) {
        const ws1 = XLSX.utils.json_to_sheet(advances.map(a => ({
            Date:          formatDate(a.date),
            'Type Vanille': a.vanilleType === 'verte' ? 'Verte' : a.vanilleType === 'preparee' ? 'Préparée' : '—',
            Motif:         a.motif || '',
            Montant:       a.amount
        })));
        ws1['!cols'] = [{wch:12},{wch:14},{wch:30},{wch:15}];
        XLSX.utils.book_append_sheet(wb, ws1, 'Avances');
    }

    // Réceptions — avec colonne Type vanille + sous-totaux par type
    if (receptions.length) {
        const recVerte   = receptions.filter(r => getVanilleType(r.quality) === 'verte');
        const recPrep    = receptions.filter(r => getVanilleType(r.quality) === 'preparee');
        const rows       = receptions.map(r => ({
            Date:            formatDate(r.date),
            'Type Vanille':  getVanilleType(r.quality) === 'verte' ? 'Verte' : 'Préparée',
            Qualité:         r.quality,
            'Poids Net (kg)': r.netWeight,
            'Prix/kg':        r.price,
            Valeur:           r.totalValue
        }));
        // Lignes de sous-total
        rows.push({});
        rows.push({ Date: '── SOUS-TOTAUX ──', 'Type Vanille': '', Qualité: '', 'Poids Net (kg)': '', 'Prix/kg': '', Valeur: '' });
        rows.push({ Date: '🌿 Vanille Verte',   'Type Vanille': '', Qualité: recVerte.length + ' réc.', 'Poids Net (kg)': recVerte.reduce((s,r)=>s+r.netWeight,0), 'Prix/kg': '', Valeur: recVerte.reduce((s,r)=>s+r.totalValue,0) });
        rows.push({ Date: '✅ Vanille Préparée','Type Vanille': '', Qualité: recPrep.length  + ' réc.', 'Poids Net (kg)': recPrep.reduce((s,r)=>s+r.netWeight,0),  'Prix/kg': '', Valeur: recPrep.reduce((s,r)=>s+r.totalValue,0)  });
        rows.push({ Date: 'TOTAL',             'Type Vanille': '', Qualité: receptions.length + ' réc.', 'Poids Net (kg)': receptions.reduce((s,r)=>s+r.netWeight,0), 'Prix/kg': '', Valeur: receptions.reduce((s,r)=>s+r.totalValue,0) });
        const ws2 = XLSX.utils.json_to_sheet(rows);
        ws2['!cols'] = [{wch:12},{wch:14},{wch:12},{wch:14},{wch:12},{wch:14}];
        XLSX.utils.book_append_sheet(wb, ws2, 'Réceptions');
    }

    // Remboursements
    if (remboursements.length) {
        const ws3 = XLSX.utils.json_to_sheet(remboursements.map(r=>({ Date:formatDate(r.date), Note:r.note||'', Montant:r.amount })));
        ws3['!cols'] = [{wch:12},{wch:30},{wch:15}];
        XLSX.utils.book_append_sheet(wb, ws3, 'Remboursements');
    }

    // Paiements
    if (paiements.length) {
        const ws4 = XLSX.utils.json_to_sheet(paiements.map(p=>({ Date:formatDate(p.date), Note:p.note||'', Montant:p.amount })));
        ws4['!cols'] = [{wch:12},{wch:30},{wch:15}];
        XLSX.utils.book_append_sheet(wb, ws4, 'Paiements de Solde');
    }

    XLSX.writeFile(wb, `Details_${collector.name.replace(/\s/g,'_')}_${currentYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export Excel réussi!', 'success');
}

// ── Receipt Print ─────────────────────────────────────────────
function generateReceipt(receptionId) {
    const existing = document.getElementById('risevanillaPrintModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'risevanillaPrintModal';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);`;
    modal.innerHTML = `
        <div style="background:var(--md-sys-color-surface);border-radius:20px;padding:32px;max-width:380px;width:90%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.4);">
            <h3 style="margin-bottom:8px;font-size:20px;color:var(--md-sys-color-on-surface);">🖨️ Imprimer le Reçu</h3>
            <p style="font-size:14px;color:var(--md-sys-color-on-surface-variant);margin-bottom:24px;">Choisissez le format d'impression</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
                <button id="btnA4" class="btn btn-primary" style="flex:1;min-width:120px;">
                    <span class="material-icons">description</span> Format A4
                </button>
                <button id="btnThermal" class="btn btn-secondary" style="flex:1;min-width:120px;">
                    <span class="material-icons">receipt</span> Thermique
                </button>
            </div>
            <button id="btnCancel" style="margin-top:16px;background:none;border:none;color:var(--md-sys-color-on-surface-variant);cursor:pointer;font-size:14px;">Annuler</button>
        </div>`;

    document.body.appendChild(modal);
    document.getElementById('btnA4').onclick      = () => { modal.remove(); generateReceiptA4(receptionId); };
    document.getElementById('btnThermal').onclick = () => { modal.remove(); generateReceiptThermal(receptionId); };
    document.getElementById('btnCancel').onclick  = () => modal.remove();

    const esc = e => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function generateReceiptA4(receptionId) {
    const base = appData.receptions.find(r => r.id === receptionId);
    if (!base) return;
    const collector = appData.collectors.find(c => c.id === base.collectorId);
    const dayRecs   = appData.receptions.filter(r => r.collectorId === base.collectorId && r.date === base.date);
    const totalNet  = dayRecs.reduce((s,r)=>s+r.netWeight,0);
    const totalVal  = dayRecs.reduce((s,r)=>s+r.totalValue,0);
    const recNum    = `R${new Date(base.date).getTime().toString().slice(-5)}${base.collectorId}`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
        body{font-family:Arial,sans-serif;margin:30px;font-size:12px;color:#333;}
        .header{text-align:center;border-bottom:2px solid #6750a4;padding-bottom:16px;margin-bottom:20px;}
        .company{font-size:28px;font-weight:700;color:#6750a4;}
        .subtitle{font-size:14px;color:#666;}
        .receipt-no{font-size:13px;font-weight:600;margin-top:8px;}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
        .info-box{border:1px solid #ddd;border-radius:8px;padding:12px;}
        .info-label{font-size:11px;color:#888;margin-bottom:4px;}
        .info-value{font-weight:600;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #ddd;padding:8px;text-align:left;}
        th{background:#f2f2f2;}
        .total-row{font-weight:700;background:#e8def8;}
        .signature{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;}
        .sig-line{border-top:1px solid #333;padding-top:8px;text-align:center;font-size:11px;}
    </style>
    </head><body>
    ${_logoHeader('REÇU DE RÉCEPTION', recNum)}
    <div class="info-grid">
        <div class="info-box"><div class="info-label">Collecteur</div><div class="info-value">${collector?.name||'N/A'}</div></div>
        <div class="info-box"><div class="info-label">Date</div><div class="info-value">${formatDate(base.date)}</div></div>
    </div>
    <table>
        <thead><tr><th>Qualité</th><th>Poids Net (kg)</th><th>Prix/kg</th><th>Valeur</th></tr></thead>
        <tbody>
            ${dayRecs.map(r=>`<tr><td>${r.quality}</td><td>${r.netWeight.toFixed(2)}</td><td>${formatCurrency(r.price)}</td><td>${formatCurrency(r.totalValue)}</td></tr>`).join('')}
            <tr class="total-row"><td colspan="2">TOTAL</td><td>${totalNet.toFixed(2)} kg</td><td>${formatCurrency(totalVal)}</td></tr>
        </tbody>
    </table>
    <div class="signature">
        <div class="sig-line">Signature Collecteur</div>
        <div class="sig-line">Signature Responsable</div>
    </div>
    <script>window.onload=()=>window.print();</script>
    </body></html>`;
    _printWindow(html);
}

function generateReceiptThermal(receptionId) {
    const base = appData.receptions.find(r => r.id === receptionId);
    if (!base) return;
    const collector = appData.collectors.find(c => c.id === base.collectorId);
    const dayRecs   = appData.receptions.filter(r => r.collectorId === base.collectorId && r.date === base.date);
    const totalNet  = dayRecs.reduce((s, r) => s + r.netWeight, 0);
    const totalVal  = dayRecs.reduce((s, r) => s + r.totalValue, 0);

    const recNum  = 'R' + String(base.id).padStart(7, '0');
    const colName = collector?.name || 'N/A';
    const dateStr = formatDate(base.date);

    // ── Helper ASCII — supprime les diacritiques ────────────────
    function _ascii(s) {
        return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // ── Payload QR — multiligne, ASCII-safe ─────────────────────
    // Cohérent avec advances.js : \n, _ascii(), U+00A0/U+202F → espace
    const _poidsQr  = totalNet.toFixed(1) + ' Kg';
    const _valeurQr = Math.round(totalVal).toLocaleString('fr-MG')
                          .replace(/[\u00a0\u202f]/g, ' ') + ' Ar';
    const qrPayload = 'No: ' + recNum
        + '\nCollecteur : ' + _ascii(colName)
        + '\nPoids : '      + _poidsQr
        + '\nValeur : '     + _valeurQr
        + '\nDate : '       + dateStr;

    // ── Lignes de détail ────────────────────────────────────────
    const detailLines = dayRecs.map(r =>
        `<tr><td>Vanille ${r.quality}</td><td class="right bold">${r.netWeight.toFixed(2)} kg</td></tr>`
    ).join('');

    const now       = new Date();
    const timestamp = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR');

    // ── Génère le SVG QR dans le DOM parent (avant ouverture popup) ─
    // Architecture identique à advances.js : QR pré-généré → SVG statique injecté
    // → zéro <script src>, zéro timing, 100% offline, tous navigateurs
    function _buildQrSvg() {
        const tmp = document.createElement('div');
        tmp.style.cssText = 'position:absolute;left:-9999px;visibility:hidden;';
        document.body.appendChild(tmp);
        let svg = '';
        try {
            new QRCode(tmp, {
                text:         qrPayload,
                width:        90,
                height:       90,
                typeNumber:   0,
                colorDark:    '#000000',
                colorLight:   '#ffffff',
                correctLevel: QRCode.CorrectLevel.L
            });
            let raw = tmp.innerHTML || '';
            if (raw.indexOf('<svg') !== -1) {
                raw = raw.replace(/(<svg[^>]*?)\s*width="[^"]*"/,  '$1 width="24mm"');
                raw = raw.replace(/(<svg[^>]*?)\s*height="[^"]*"/, '$1 height="24mm"');
                raw = raw.replace('<svg ', '<svg style="display:block;margin:0 auto;" ');
                svg = raw;
            }
        } catch(e) {
            console.warn('[RISEVANILLA] QR réception error:', e);
        } finally {
            if (tmp.parentNode) { document.body.removeChild(tmp); }
        }
        return svg;
    }

    // ── Ouvre le popup avec SVG QR statique ────────────────────
    function _openPopup(qrSvgHtml) {
        const qrBlock = qrSvgHtml
            ? `<div class="qr-wrap">${qrSvgHtml}</div><div class="qr-ref">${recNum}</div>`
            : '';

        const w = window.open('', '_blank');
        if (!w) { showToast('Popup bloqué — autorisez les popups', 'error'); return; }

        const html = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8">
<title>Re\u00e7u ${recNum} \u2014 RISEVANILLA</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{background:#e0e0e0;min-height:100%}
body{background:#e0e0e0;display:flex;flex-direction:column;align-items:center;
     padding:20px 0 40px;font-family:'Courier New',Courier,monospace;font-size:12px;color:#000;line-height:1.6}
.toolbar{width:80mm;display:flex;gap:8px;margin-bottom:12px}
.toolbar button{flex:1;padding:7px 0;border:none;border-radius:6px;
     font-family:Arial,sans-serif;font-size:13px;cursor:pointer;font-weight:600}
.btn-print{background:#1a1a1a;color:#fff}
.btn-close{background:#ccc;color:#333}
#ticket{width:80mm;background:#fff;padding:4mm 4mm 6mm;line-height:1.6;box-shadow:0 2px 12px rgba(0,0,0,.25)}
.t-center{text-align:center}
.hd-title{font-size:15px;font-weight:700;letter-spacing:1.5px;text-align:center;margin-bottom:1px}
.hd-subtitle{font-size:11px;font-weight:700;letter-spacing:.8px;text-align:center;margin-bottom:4px}
.sep-dash{border:none;border-top:1px dashed #000;margin:6px 0}
.sep-solid{border:none;border-top:1px solid #000;margin:6px 0}
.info-table{width:100%;border-collapse:collapse;margin-bottom:2px}
.info-table td{padding:2px 0;vertical-align:top;line-height:1.6}
.info-table td.lbl{width:50%}
.info-table td.val{text-align:right;font-weight:700}
.info-table td.val-normal{text-align:right;font-weight:400}
.section-ttl{font-weight:700;margin:4px 0 3px}
.detail-table{width:100%;border-collapse:collapse}
.detail-table td{padding:3px 0;line-height:1.5;vertical-align:middle}
.detail-table td.right{text-align:right;font-weight:700}
.total-box{border:1px solid #000;padding:6px 8px;margin:7px 0}
.total-box .lbl{font-size:10px;font-weight:700;text-align:center;letter-spacing:.6px;margin-bottom:1px}
.total-box .val{font-size:14px;font-weight:700;text-align:center;margin-bottom:5px}
.total-box .val:last-child{margin-bottom:0}
.qr-wrap{text-align:center;margin:6px 0 2px;line-height:0}
.qr-wrap svg{width:24mm!important;height:24mm!important;display:block;margin:0 auto}
.qr-ref{font-size:10px;text-align:center;margin:3px 0 5px;line-height:1.5}
.sig-section{margin:8px 0 4px}
.sig-label{font-size:11px;text-align:center;margin-top:22mm;margin-bottom:4px;line-height:1.6}
.sig-line{border-top:1px solid #000;width:52mm;margin:0 auto}
.footer{font-size:9px;text-align:center;margin-top:8px;line-height:1.7}
@media print{
    @page{size:80mm auto;margin:0}
    html,body{background:#fff!important;display:block!important;padding:0!important}
    .toolbar{display:none!important}
    #ticket{width:80mm!important;box-shadow:none!important;padding:3mm 3mm 5mm!important;page-break-inside:avoid}
}
</style></head><body>

<div class="toolbar no-print">
    <button class="btn-print" onclick="window.print()">&#128438; Imprimer</button>
    <button class="btn-close" onclick="window.close()">&#10005; Fermer</button>
</div>

<div id="ticket">

    ${_logoHeaderThermal()}
    <div class="hd-title">RISEVANILLA</div>
    <div class="hd-subtitle">RECU RECEPTION</div>

    <hr class="sep-dash">

    <table class="info-table">
        <tr><td class="lbl">N&#176; Re\u00e7u:</td><td class="val-normal">${recNum}</td></tr>
        <tr><td class="lbl">Date:</td>          <td class="val-normal">${dateStr}</td></tr>
        <tr><td class="lbl">Collecteur:</td>    <td class="val">${colName}</td></tr>
    </table>

    <hr class="sep-dash">

    <div class="section-ttl">DETAILS:</div>
    <table class="detail-table">
        ${detailLines}
    </table>

    <hr class="sep-solid">

    <div class="total-box">
        <div class="lbl">TOTAL POIDS</div>
        <div class="val">${totalNet.toFixed(2)} kg</div>
        <hr class="sep-dash" style="margin:4px 0;">
        <div class="lbl">VALEUR TOTALE</div>
        <div class="val">${totalVal.toLocaleString('fr-MG')} Ar</div>
    </div>

    ${qrBlock}

    <hr class="sep-dash">

    <div class="sig-section">
        <div class="sig-label">Signature du responsable de r\u00e9ception</div>
        <div class="sig-line"></div>
    </div>

    <div class="footer">
        Merci de votre confiance<br>
        ${timestamp}
    </div>

</div><!-- /#ticket -->

<script>window.onload=function(){setTimeout(function(){window.print();},400)};<\/script>
</body></html>`;

        w.document.write(html);
        w.document.close();
    }

    // ── Dispatch : QRCode dispo → direct ; sinon chargement dynamique ──
    if (typeof QRCode === 'function') {
        _openPopup(_buildQrSvg());
    } else {
        console.info('[RISEVANILLA] Chargement dynamique qrcode.min.js (réception)...');
        const _s = document.createElement('script');
        _s.src = 'assets/qrcode.min.js';
        _s.onload  = function() { _openPopup(_buildQrSvg()); };
        _s.onerror = function() {
            console.warn('[RISEVANILLA] qrcode.min.js introuvable — reçu sans QR');
            _openPopup('');
        };
        document.head.appendChild(_s);
    }
}
// ── Delivery PDF ──────────────────────────────────────────────

/**
 * Convertit un entier positif en toutes lettres (français).
 * Gère : 0–999 999 999, accords de « cent » et « vingt »,
 * tirets, cas particuliers 71–79 et 91–99.
 */
function _nombreEnLettres(n) {
    n = Math.round(Math.abs(n));
    if (n === 0) return 'zéro';

    const UNITES = [
        '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept',
        'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze',
        'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'
    ];
    const DIZAINES = [
        '', '', 'vingt', 'trente', 'quarante', 'cinquante',
        'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'
    ];

    /**
     * Convertit un entier 1–999 en lettres (style traditionnel : espaces entre groupes,
     * tirets conservés uniquement dans les composés figés : quatre-vingt, dix-sept…).
     * @param {number} nb        - Nombre à convertir (1–999)
     * @param {boolean} centPlur - Autoriser l'accord de « cents » (true seulement pour le dernier groupe)
     */
    function _centaine(nb, centPlur) {
        if (nb === 0) return '';
        let r = '';
        const c    = Math.floor(nb / 100);
        const rest = nb % 100;

        // Centaines
        if (c > 0) {
            r += (c === 1 ? '' : UNITES[c] + ' ') + 'cent';
            // « cents » uniquement si multiple exact de 100, > 1 cent, et dernier groupe
            if (rest === 0 && centPlur && c > 1) r += 's';
        }
        if (rest === 0) return r;
        if (r) r += ' ';

        // Unités et dizaines
        if (rest < 20) {
            r += UNITES[rest];
        } else {
            const diz = Math.floor(rest / 10);
            const u   = rest % 10;

            if (diz === 7 || diz === 9) {
                // 70–79 : soixante dix-sept… soixante et onze
                // 90–99 : quatre-vingt dix… quatre-vingt onze
                // 71 prend « et » (soixante et onze) mais pas 91 (quatre-vingt onze)
                const liaison = (u === 1 && diz === 7) ? ' et ' : ' ';
                r += DIZAINES[diz] + liaison + UNITES[10 + u];
            } else {
                r += DIZAINES[diz];
                if (u === 1 && diz !== 8) {
                    r += ' et un';       // vingt et un, trente et un…
                } else if (u > 0) {
                    r += ' ' + UNITES[u];
                } else if (diz === 8) {
                    r += 's';           // quatre-vingts (sans unité)
                }
            }
        }
        return r;
    }

    const millions = Math.floor(n / 1_000_000);
    const milliers = Math.floor((n % 1_000_000) / 1_000);
    const reste    = n % 1_000;
    const parts    = [];

    if (millions > 0) {
        // « cent » dans le groupe millions : pluriel uniquement s'il est le dernier groupe
        const centPlurMil = (milliers === 0 && reste === 0);
        parts.push(_centaine(millions, centPlurMil) + (millions === 1 ? ' million' : ' millions'));
    }
    if (milliers > 0) {
        // « mille » est invariable ; « cent » dans ce groupe ne prend jamais de s (suivi de mille)
        const prefixe = milliers === 1 ? '' : _centaine(milliers, false) + ' ';
        parts.push(prefixe + 'mille');
    }
    if (reste > 0) {
        // Dernier groupe : « cent » peut prendre un « s »
        parts.push(_centaine(reste, true));
    }

    return parts.join(' ');
}

function generateDeliveryPDF(deliveryId, type = 'BL') {
    const delivery = appData.deliveries.find(d => d.id === deliveryId);
    if (!delivery) { showToast('Livraison introuvable', 'error'); return; }

    const number = type === 'BL' ? delivery.bl : delivery.invoice;
    const title  = type === 'BL' ? 'BON DE LIVRAISON' : 'FACTURE';

    // ── Tableau et bloc financier selon le type ───────────────
    let tableHead, tableBody, montantEnLettres = '';

    if (type === 'BL') {
        // BL : strictement descriptif — aucune information financière
        tableHead = `<tr>
            <th>Désignation</th>
            <th>Qualité</th>
            <th>Poids Brut (kg)</th>
            <th>Tare (kg)</th>
            <th>Poids Net (kg)</th>
        </tr>`;
        tableBody = `
            <tr>
                <td>Vanille</td>
                <td>${delivery.quality||'N/A'}</td>
                <td>${delivery.grossWeight||'0'}</td>
                <td>${delivery.bagWeight||'0'}</td>
                <td>${delivery.weight||'0'}</td>
            </tr>
            <tr class="total-row">
                <td colspan="4">TOTAL POIDS NET</td>
                <td>${delivery.weight||'0'} kg</td>
            </tr>`;
    } else {
        // Facture : colonnes complètes + montant en lettres
        const total   = delivery.totalValue || 0;
        const lettres = _nombreEnLettres(total);
        const lettresMaj = lettres.charAt(0).toUpperCase() + lettres.slice(1);
        montantEnLettres = `
            <div style="margin-top:16px;padding:12px 16px;border:1px solid #bbb;border-radius:6px;
                        font-size:12px;color:#333;line-height:1.7;">
                <strong>Arrêté la présente facture à la somme de :</strong><br>
                <span style="font-style:italic;">${lettresMaj} ariary</span>
            </div>`;
        tableHead = `<tr>
            <th>Désignation</th>
            <th>Qualité</th>
            <th>Poids Brut (kg)</th>
            <th>Tare (kg)</th>
            <th>Poids Net (kg)</th>
            <th>Prix/kg</th>
            <th>Valeur</th>
        </tr>`;
        tableBody = `
            <tr>
                <td>Vanille</td>
                <td>${delivery.quality||'N/A'}</td>
                <td>${delivery.grossWeight||'0'}</td>
                <td>${delivery.bagWeight||'0'}</td>
                <td>${delivery.weight||'0'}</td>
                <td>${formatCurrency(delivery.price||0)}</td>
                <td>${formatCurrency(total)}</td>
            </tr>
            <tr class="total-row">
                <td colspan="6">TOTAL</td>
                <td>${formatCurrency(total)}</td>
            </tr>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title} — RISEVANILLA</title>
    <style>
        body{font-family:Arial,sans-serif;margin:30px;font-size:12px;}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #6750a4;}
        .company{font-size:24px;font-weight:700;color:#6750a4;}
        .doc-type{font-size:18px;font-weight:700;color:#333;}
        .doc-num{font-size:14px;color:#666;margin-top:4px;}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
        .info-box{border:1px solid #ddd;border-radius:8px;padding:12px;}
        .info-label{font-size:11px;color:#888;margin-bottom:4px;}
        .info-value{font-weight:600;font-size:13px;}
        table{width:100%;border-collapse:collapse;margin-bottom:20px;}
        th,td{border:1px solid #ddd;padding:10px;text-align:left;}
        th{background:#6750a4;color:#fff;}
        .total-row{font-weight:700;background:#f8f9fa;}
        .signatures{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:48px;}
        .sig-line{border-top:1px solid #333;padding-top:8px;text-align:center;font-size:11px;color:#666;}
    </style>
    </head><body>
    ${_logoHeader(title, number||'—')}
    <div class="info-grid">
        <div class="info-box"><div class="info-label">Date</div><div class="info-value">${formatDate(delivery.date)}</div></div>
        <div class="info-box"><div class="info-label">Exportateur</div><div class="info-value">${delivery.exporter||'N/A'}</div></div>
    </div>
    <table>
        <thead>${tableHead}</thead>
        <tbody>${tableBody}</tbody>
    </table>
    ${montantEnLettres}
    <div class="signatures">
        <div class="sig-line">Signature Livreur / RISEVANILLA</div>
        <div class="sig-line">Signature Destinataire / ${delivery.exporter||'Exportateur'}</div>
    </div>
    <script>window.onload=()=>window.print();</script>
    </body></html>`;
    _printWindow(html);
}

// ── Export Invoice (all receptions PDF) ───────────────────────
function exportInvoice() {
    const receptionsByCollector = {};
    (getReceptionsForCurrentYear()).forEach(r => {
        const c = appData.collectors.find(col=>col.id===r.collectorId);
        const name = c ? c.name : 'Supprimé';
        if (!receptionsByCollector[name]) receptionsByCollector[name] = [];
        receptionsByCollector[name].push(r);
    });

    let body = '';
    Object.entries(receptionsByCollector).forEach(([name, recs]) => {
        const totalNet = recs.reduce((s,r)=>s+r.netWeight,0);
        const totalVal = recs.reduce((s,r)=>s+r.totalValue,0);
        body += `<h2>${name}</h2>
        <table><thead><tr><th>Date</th><th>Qualité</th><th>Poids Net (kg)</th><th>Prix/kg</th><th>Valeur</th></tr></thead>
        <tbody>
            ${recs.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(r=>`
            <tr><td>${formatDate(r.date)}</td><td>${r.quality}</td><td>${r.netWeight.toFixed(2)}</td><td>${formatCurrency(r.price)}</td><td>${formatCurrency(r.totalValue)}</td></tr>`).join('')}
            <tr class="total"><td colspan="2">TOTAL</td><td>${totalNet.toFixed(2)} kg</td><td></td><td>${formatCurrency(totalVal)}</td></tr>
        </tbody></table>`;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facture — RISEVANILLA</title>
    <style>${_PDF_BASE_STYLE}</style></head><body>
    ${_logoHeader('FACTURE DES RÉCEPTIONS — ' + currentYear)}
    ${body}
    <script>window.onload=()=>window.print();</script>
    </body></html>`;
    _printWindow(html);
}
